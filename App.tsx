

// FIX: Import useRef to be used in the AICoachView component.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, HealthData, ProfileData, ChatMessage, DetailViewType } from './types';
import { RadarChart, LineChart, BarChart } from './components/charts';
import { generateHeartRateData, generateGenericMetricData, generateSleepData } from './utils';
import { generateRecommendations, generateWeeklySummary, getCoachResponse, generateTtsAudio } from './services/geminiService.ts';
// FIX: Import d3 for use in time parsing.
import * as d3 from 'd3';

// --- INITIAL DATA ---
const initialProfileData: ProfileData = {
    name: 'Alex Doe',
    age: 34,
    height: 175,
    weight: 72,
};

const initialHealthData: HealthData = {
    score: 87,
    scoreChange: "+5%",
    hr: 68,
    hrMin: 58,
    hrMax: 145,
    bp: "118/78",
    spo2: 98,
    temp: 36.7,
    steps: 8432,
    stepsGoal: 10000,
    calories: 2145,
    active: 67,
    distance: 6.2,
    sleepHours: 7.5,
    sleepQuality: 82,
    sleepDeep: 2.5,
    sleepRem: 1.6,
    sleepLight: 3.2,
    stress: 35,
    analysisText: "Status: Geringes Risiko. Leichte Abweichungen im Herz-Kreislauf-Muster erkannt.",
    analysisStatus: "low",
    radarData: [
        { axis: "Herz-Kreislauf", value: 0.9 },
        { axis: "Atmung", value: 0.95 },
        { axis: "Schlaf", value: 0.9 },
        { axis: "Aktivität", value: 0.85 },
        { axis: "Stress", value: 0.65 }
    ],
    hrvData: [
        { time: "00:00", value: 60 },{ time: "02:00", value: 58 },{ time: "04:00", value: 55 },{ time: "06:00", value: 57 },{ time: "08:00", value: 65 },{ time: "10:00", value: 70 },{ time: "12:00", value: 68 },{ time: "14:00", value: 66 },{ time: "16:00", value: 64 },{ time: "18:00", value: 68 },{ time: "20:00", value: 70 },{ time: "22:00", value: 65 }
    ]
};

// --- HELPER COMPONENTS (defined outside main App to prevent re-renders) ---

interface HeaderProps {
    onNavigate: (view: View) => void;
}
const Header: React.FC<HeaderProps> = ({ onNavigate }) => (
    <header className="bg-white shadow-sm sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <button onClick={() => onNavigate('dashboard')} className="flex items-center space-x-2">
                    <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                    <span className="font-bold text-xl text-gray-800">HealthGuard</span>
                </button>
                <div className="hidden sm:flex items-center space-x-4">
                    <button onClick={() => onNavigate('report')} className="text-sm font-medium text-gray-600 hover:text-blue-600">Bericht</button>
                    <button onClick={() => onNavigate('share')} className="text-sm font-medium text-gray-600 hover:text-blue-600">Teilen</button>
                    <span className="flex items-center space-x-1 text-sm font-medium text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM10 18a.75.75 0 0 1 .75.75v.001a.75.75 0 0 1-1.5 0V18.75a.75.75 0 0 1 .75-.75ZM15.03 4.97a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM5.97 14.03a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0Zm11.21-4.28a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM2.82 9.72a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm11.21 4.28a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM5.97 5.97a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06L5.97 7.03a.75.75 0 0 1 0-1.06ZM10 5.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" clipRule="evenodd" /></svg>
                        <span>Smartwatch</span>
                    </span>
                    <button onClick={() => onNavigate('settings')} className="text-gray-500 hover:text-gray-800">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
                    </button>
                </div>
            </div>
        </nav>
    </header>
);

const Loader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center py-4">
        <div className="loader"></div>
        <p className="ml-3 text-gray-500">{text}</p>
    </div>
);

const BackButton: React.FC<{ onClick: () => void; text?: string }> = ({ onClick, text = "Zurück zum Dashboard" }) => (
    <button onClick={onClick} className="flex items-center space-x-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        <span>{text}</span>
    </button>
);

// --- MAIN APP COMPONENT ---

export default function App() {
    const [view, setView] = useState<View>('dashboard');
    const [healthData, setHealthData] = useState<HealthData>(initialHealthData);
    const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);

    const handleNavigate = (newView: View) => {
        setView(newView);
        window.scrollTo(0, 0);
    };

    const simulateAlgorithm = useCallback((data: HealthData): Partial<HealthData> => {
        let newScore = 50;
        let newAnalysisText = "";
        let newStatus: 'low' | 'medium' | 'high' = "low";
        
        const { hr, stress, steps, sleepHours, spo2 } = data;
        
        if (stress > 80) {
            newScore -= 30;
            newAnalysisText = "Status: Hohes Risiko. Extrem hohes Stresslevel (über 80) erkannt. Dies beeinträchtigt Ihre Erholung signifikant.";
            newStatus = "high";
        } else if (stress > 60) {
            newScore -= 15;
            newAnalysisText = "Status: Mittleres Risiko. Erhöhtes Stresslevel (über 60) festgestellt. Achten Sie auf Entspannung.";
            newStatus = "medium";
        } else {
            newScore += 10;
        }
        
        if (sleepHours < 6) {
            newScore -= 15;
            if (!newAnalysisText) newAnalysisText = "Status: Mittleres Risiko. Schlafmangel (unter 6 Std.) festgestellt.";
            if (newStatus === 'low') newStatus = "medium";
        } else if (sleepHours > 7) {
            newScore += 15;
        }
        
        if (steps > 10000) newScore += 20;
        else if (steps < 3000) newScore -= 10;
        
        if (hr > 85) {
            newScore -= 20;
            newAnalysisText = `Status: Mittleres Risiko. Ein erhöhter Ruhepuls von ${hr} BPM wurde festgestellt.`;
            newStatus = "medium";
        }
        
        if (spo2 < 92) {
            newScore -= 30;
            newAnalysisText = `Status: Hohes Risiko. Niedrige Blutsauerstoffsättigung (${spo2}%) erkannt. Dies erfordert Aufmerksamkeit.`;
            newStatus = "high";
        }
        
        if (!newAnalysisText) {
            newAnalysisText = "Status: Geringes Risiko. Alle Vitalwerte sind im optimalen Bereich.";
            newStatus = "low";
        }

        const finalScore = Math.max(0, Math.min(100, newScore));
        const newRadarData = [...data.radarData];
        newRadarData[0].value = Math.max(0.1, (100 - (hr > 70 ? (hr - 70) * 2 : 0)) / 100);
        newRadarData[2].value = Math.max(0.1, sleepHours / 8.0);
        newRadarData[3].value = Math.max(0.1, steps / 10000.0);
        newRadarData[4].value = Math.max(0.1, (100 - stress) / 100);

        return {
            score: finalScore,
            analysisText: newAnalysisText,
            analysisStatus: newStatus,
            radarData: newRadarData
        };
    }, []);

    const handleDataUpdate = (newData: Partial<HealthData>) => {
        setHealthData(prevData => {
            const updatedData = { ...prevData, ...newData };
            const simulationResult = simulateAlgorithm(updatedData);
            return { ...updatedData, ...simulationResult };
        });
    };

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <DashboardView healthData={healthData} onNavigate={handleNavigate} />;
            case 'predictive-analysis':
                return <AnalysisView healthData={healthData} onBack={() => handleNavigate('dashboard')} />;
            case 'ai-coach':
                 return <AICoachView healthData={healthData} onBack={() => handleNavigate('dashboard')} />;
            case 'report':
            case 'share':
                return <ReportAndShareView view={view} healthData={healthData} onBack={() => handleNavigate('dashboard')} />;
            case 'settings':
            case 'demo-mode':
            case 'profile-settings':
            case 'notifications-settings':
            case 'privacy-settings':
                return <SettingsView 
                            initialView={view}
                            healthData={healthData}
                            profileData={profileData}
                            onHealthDataUpdate={handleDataUpdate}
                            onProfileUpdate={setProfileData} 
                            onNavigate={handleNavigate}
                        />;
            case 'watch':
                return <WatchView onBack={() => handleNavigate('dashboard')} />;
            case 'hr-detail':
            case 'bp-detail':
            case 'spo2-detail':
            case 'temp-detail':
            case 'steps-detail':
            case 'calories-detail':
            case 'active-detail':
            case 'distance-detail':
            case 'sleep-detail':
            case 'score-detail':
                const detailType = view.replace('-detail', '') as DetailViewType;
                return <DetailView type={detailType} healthData={healthData} onBack={() => handleNavigate('dashboard')} />;
            default:
                return <DashboardView healthData={healthData} onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header onNavigate={handleNavigate} />
            <div className="flex-grow">
                {renderView()}
            </div>
        </div>
    );
}

// --- VIEW COMPONENTS ---

const DashboardView: React.FC<{ healthData: HealthData; onNavigate: (view: View) => void; }> = ({ healthData, onNavigate }) => {
    
    const { analysisStatus, analysisText, score, scoreChange, radarData, hrvData, hr, hrMin, hrMax, bp, spo2, temp, steps, stepsGoal, calories, active, distance, sleepHours, sleepQuality, sleepDeep, sleepLight, sleepRem, stress } = healthData;

    const stressStatus = stress > 70 ? { label: 'Hoch', color: 'red' } : stress > 40 ? { label: 'Mittel', color: 'yellow' } : { label: 'Niedrig', color: 'green' };

    const parsedHrvData = hrvData.map(d => ({ ...d, time: d3.timeParse("%H:%M")(d.time) as Date }));

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <div className="space-y-6">
                {/* Predictive Analysis Card */}
                <div onClick={() => onNavigate('predictive-analysis')} className={`p-4 rounded-lg flex items-center justify-between shadow-lg clickable-card text-white 
                    ${analysisStatus === 'high' ? 'bg-gradient-to-r from-red-600 to-red-500' : analysisStatus === 'medium' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-blue-600 to-indigo-500'}`}>
                    <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <div>
                            <h3 className="font-semibold">Prädiktive Gesundheitsanalyse</h3>
                            <p className="text-sm opacity-90 truncate pr-4">{analysisText}</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                </div>
                {/* AI Coach Card - NEW */}
                <div onClick={() => onNavigate('ai-coach')} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 rounded-lg flex items-center justify-between shadow-lg clickable-card">
                    <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.026.222-.014.442.028.658a.78.78 0 0 1-.585.843ZM14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM16.328 12.84a.78.78 0 0 1-.442.358 3 3 0 0 1-3.516-4.308 6.484 6.484 0 0 0 3.959 1.905c.222.026.442.014.658-.028a.78.78 0 0 1 .843.585Z" /></svg>
                        <div>
                            <h3 className="font-semibold">Ihr persönlicher AI-Coach</h3>
                            <p className="text-sm opacity-90">Fragen Sie nach Training, Ernährung und mehr</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                </div>
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Health Score */}
                        <div onClick={() => onNavigate('score-detail')} className="bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 text-white p-6 rounded-lg shadow-xl flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6 clickable-card">
                            <div>
                                <span className="text-sm font-medium uppercase opacity-90">Gesundheitsscore (Heute)</span>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-7xl font-bold">{score}</span>
                                    <span className="text-3xl font-medium opacity-80">/ 100</span>
                                </div>
                                <div className="mt-2 flex items-center space-x-2">
                                    <span className="inline-flex items-center bg-white/20 rounded-full px-2 py-1 text-xs font-medium">
                                        {scoreChange} diese Woche
                                    </span>
                                    <span className="text-sm font-medium opacity-90">Details ansehen</span>
                                </div>
                            </div>
                            <div className="w-full md:w-64 h-64 flex-shrink-0"><RadarChart data={radarData} /></div>
                        </div>
                        {/* HRV Chart */}
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Herzfrequenz Verlauf (24h)</h3>
                            <div className="h-64"><LineChart data={parsedHrvData} color="#ef4444" yDomain={[40, 160]} /></div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                         {/* Metric Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard icon="hr" value={hr} unit="BPM" label="Herzfrequenz" onClick={() => onNavigate('hr-detail')} />
                            <MetricCard icon="bp" value={bp} unit="mmHg" label="Blutdruck" onClick={() => onNavigate('bp-detail')} />
                            <MetricCard icon="spo2" value={spo2} unit="%" label="SpO2" onClick={() => onNavigate('spo2-detail')} />
                            <MetricCard icon="temp" value={temp} unit="°C" label="Temperatur" onClick={() => onNavigate('temp-detail')} />
                        </div>
                        {/* Activity Cards */}
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Tägliche Aktivität</h3>
                            <ActivityCard icon="steps" value={steps.toLocaleString('de-DE')} label="Schritte" goal={`von ${stepsGoal.toLocaleString('de-DE')} Ziel`} onClick={() => onNavigate('steps-detail')} />
                            <ActivityCard icon="calories" value={calories.toLocaleString('de-DE')} label="Kalorien" goal="kcal verbrannt" onClick={() => onNavigate('calories-detail')} />
                            <ActivityCard icon="active" value={active} label="Aktiv" goal="Minuten" onClick={() => onNavigate('active-detail')} />
                            <ActivityCard icon="distance" value={distance} label="Distanz" goal="Kilometer" onClick={() => onNavigate('distance-detail')} />
                        </div>
                        {/* Sleep Analysis */}
                        <div onClick={() => onNavigate('sleep-detail')} className="bg-white p-4 sm:p-6 rounded-lg shadow clickable-card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Schlafanalyse</h3>
                            <p className="text-3xl font-semibold text-gray-900">{sleepHours} <span className="text-xl font-medium text-gray-500">Stunden</span></p>
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
                                <div className="bg-blue-800 h-full" style={{ width: `${(sleepDeep / sleepHours) * 100}%` }} title="Tiefschlaf"></div>
                                <div className="bg-blue-500 h-full" style={{ width: `${(sleepRem / sleepHours) * 100}%` }} title="REM"></div>
                                <div className="bg-blue-300 h-full" style={{ width: `${(sleepLight / sleepHours) * 100}%` }} title="Leichtschlaf"></div>
                            </div>
                        </div>
                        {/* Stress Level */}
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-medium text-gray-700">Stresslevel</span>
                                <span className={`text-xs font-semibold bg-${stressStatus.color}-100 text-${stressStatus.color}-700 px-2 py-0.5 rounded-full`}>{stressStatus.label}</span>
                            </div>
                            <span className="text-3xl font-semibold text-gray-900">{stress}</span><span className="text-base font-medium text-gray-500">/ 100</span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className={`bg-${stressStatus.color}-500 h-1.5 rounded-full`} style={{ width: `${stress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
};

const MetricCard: React.FC<{ icon: string; value: string | number; unit: string; label: string; onClick: () => void; }> = ({ icon, value, unit, label, onClick }) => {
    const icons: { [key: string]: JSX.Element } = {
        hr: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,
        bp: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-500"><path d="M10.362 1.69a.75.75 0 0 0-1.071-.237L5.34 4.045A1.75 1.75 0 0 0 4.25 5.6v1.45c0 3.61 2.468 6.94 5.857 8.35a.75.75 0 0 0 .286 0c3.389-1.41 5.857-4.74 5.857-8.35V5.6a1.75 1.75 0 0 0-1.09-1.555l-3.951-2.592a.75.75 0 0 0-.824-.037Z" /><path d="M9.69 6.69a.75.75 0 0 1 1.06 0l1.25 1.25a.75.75 0 1 1-1.06 1.06L10.5 8.56V12a.75.75 0 0 1-1.5 0V8.56l-.44.44a.75.75 0 0 1-1.06-1.06l1.25-1.25Z" /></svg>,
        spo2: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-teal-500"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.25h-2.25a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25h2.25a.75.75 0 0 0 0-1.5h-2.25V6.75Z" clipRule="evenodd" /></svg>,
        temp: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-orange-500"><path d="M10 12.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Z" /><path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v6.586l1.97-1.97a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L6.22 8.426a.75.75 0 1 1 1.06-1.06l1.97 1.97V2.75A.75.75 0 0 1 10 2Z" clipRule="evenodd" /><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-1.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" clipRule="evenodd" /></svg>,
    };
    return (
        <div onClick={onClick} className="bg-white p-4 rounded-lg shadow clickable-card">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                {icons[icon]}
            </div>
            <span className="text-3xl font-semibold text-gray-900">{value}</span>
            <span className="text-sm ml-1">{unit}</span>
        </div>
    );
};

const ActivityCard: React.FC<{ icon: string; value: string | number; label: string; goal: string; onClick: () => void; }> = ({ icon, value, label, goal, onClick }) => {
    const icons: { [key: string]: { el: JSX.Element, bg: string } } = {
        steps: { el: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600"><path fillRule="evenodd" d="M10.75 3.065A1.75 1.75 0 0 0 9 4.815V6.5a.75.75 0 0 1-1.5 0V4.815a3.25 3.25 0 0 1 5.46-2.012l.144.288a.75.75 0 0 1-1.354.676l-.144-.288a1.75 1.75 0 0 0-1.752-.428ZM8.11 8.11a.75.75 0 0 1 .638-.804A1.75 1.75 0 0 1 10.5 9v.25a.75.75 0 0 1-1.5 0V9a.25.25 0 0 0-.25-.25.75.75 0 0 1-.64-.84Zm-2.3 1.67a.75.75 0 0 1 1.023-.927 1.75 1.75 0 0 1 2.004-.543.75.75 0 0 1 .804.638 3.25 3.25 0 0 1-3.46 3.012l-.144-.288a.75.75 0 0 1 1.354-.676l.144.288a1.75 1.75 0 0 0 1.752.428.75.75 0 0 1 .64.84 3.25 3.25 0 0 1-5.46 2.012l-.144-.288a.75.75 0 1 1 1.354-.676l.144.288a1.75 1.75 0 0 0 2.004-.543.75.75 0 0 1 1.023-.927Z" clipRule="evenodd" /></svg>, bg: 'bg-green-100' },
        calories: { el: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-orange-600"><path fillRule="evenodd" d="M11.78 2.22a.75.75 0 0 1 .22.53v1.365a.75.75 0 0 1-.416.675C10.932 5.11 9.61 5.5 8.5 5.5c-1.076 0-2.131-.36-2.93-.873a.75.75 0 0 1-.416-.675V2.75a.75.75 0 0 1 .75-.75c.19 0 .37.07.51.19l.01.01c.784.63 1.8.95 2.83.95s2.046-.32 2.83-.95l.01-.01a.75.75 0 0 1 .73-.72Zm-3.03 1.155a3.25 3.25 0 0 1 1.75 0C11.134 3.653 11.75 4.51 11.75 5.5c0 .99-.616 1.847-1.5 2.122V9.25a.75.75 0 0 1-1.5 0V7.622C7.866 7.347 7.25 6.49 7.25 5.5c0-.99.616-1.847 1.5-2.122Z" clipRule="evenodd" /><path d="M10 18a.75.75 0 0 0 .75-.75V9.673a.75.75 0 0 0-.323-.629A3.001 3.001 0 0 1 10 9c-.394 0-.77.071-1.112.203a.75.75 0 0 0-.323.629V17.25A.75.75 0 0 0 10 18Z" /><path d="M10 18c-3.05 0-5.738-1.5-7.25-3.845a.75.75 0 0 1 .637-1.08C4.13 13.02 5.412 13 6.9 13c1.61 0 3.014.025 3.999-.08a.75.75 0 0 1 .8.653C11.91 16.32 11.235 18 10 18Z" /></svg>, bg: 'bg-orange-100' },
        active: { el: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-sky-600"><path fillRule="evenodd" d="M10 1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1.5ZM5.503 4.24a.75.75 0 0 1 .958-.415l1.41 1.059a.75.75 0 0 1-.543 1.373l-1.41-1.059a.75.75 0 0 1-.415-.958ZM14.497 4.24a.75.75 0 0 1 .415.958l-1.41 1.059a.75.75 0 1 1-.543-1.373l1.41-1.059a.75.75 0 0 1 .128-.085Zm-1.18 5.46a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM4.25 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM10 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /><path d="M10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM10 15c-4.414 0-8.108-2.68-8.918-6.195a.75.75 0 0 1 1.48-.31C3.308 11.63 6.368 13.5 10 13.5s6.692-1.87 7.438-5.006a.75.75 0 0 1 1.48.31C18.108 12.32 14.414 15 10 15Z" /></svg>, bg: 'bg-sky-100' },
        distance: { el: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-600"><path fillRule="evenodd" d="m9.677 2.012 5.5 1.618a.75.75 0 0 1 .58.736v9.268a.75.75 0 0 1-1.196.634l-4.756-2.854a.75.75 0 0 0-.612 0l-4.756 2.854a.75.75 0 0 1-1.196-.634V4.366a.75.75 0 0 1 .58-.736l5.5-1.618a.75.75 0 0 1 .612 0Z" clipRule="evenodd" /></svg>, bg: 'bg-purple-100' }
    };
    return (
        <div onClick={onClick} className="bg-gray-50 p-3 rounded-lg flex items-start space-x-3 clickable-card">
            <div className={`${icons[icon].bg} p-2 rounded-full`}>{icons[icon].el}</div>
            <div>
                <span className="text-sm font-medium text-gray-500">{label}</span>
                <p className="text-xl font-semibold text-gray-900">{value}</p>
                <span className="text-xs text-gray-500">{goal}</span>
            </div>
        </div>
    );
};

// FIX: Add helper functions for audio decoding as recommended by Gemini API docs.
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const AnalysisView: React.FC<{ healthData: HealthData; onBack: () => void; }> = ({ healthData, onBack }) => {
    const [recommendations, setRecommendations] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // FIX: Removed unused ttsAudio state. Playback is handled directly via AudioContext.
    const [isTtsLoading, setIsTtsLoading] = useState(false);

    const handleGenerateRecommendations = async () => {
        setIsLoading(true);
        setRecommendations('');
        const result = await generateRecommendations(healthData.analysisText);
        setRecommendations(result);
        setIsLoading(false);
    };

    // FIX: Refactored to use AudioContext for robust audio playback, removing manual WAV header creation.
    const handlePlayTts = async () => {
        if (!recommendations || isTtsLoading) return;
        setIsTtsLoading(true);

        const audioDataB64 = await generateTtsAudio(recommendations);
        if (audioDataB64) {
             try {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(
                    decode(audioDataB64),
                    outputAudioContext,
                    24000,
                    1
                );
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
                source.onended = () => {
                    setIsTtsLoading(false);
                    outputAudioContext.close();
                };
            } catch (e) {
                console.error("Error playing audio:", e);
                alert("Fehler bei der Audio-Wiedergabe.");
                setIsTtsLoading(false);
            }
        } else {
            alert("Fehler bei der Audio-Generierung.");
            setIsTtsLoading(false);
        }
    };
    
    const statusInfo = {
        high: { title: "Status: Hohes Risiko", color: "red", bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
        medium: { title: "Status: Mittleres Risiko", color: "yellow", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800" },
        low: { title: "Status: Geringes Risiko", color: "green", bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
    }[healthData.analysisStatus];

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <div className="bg-white p-6 rounded-lg shadow">
                <BackButton onClick={onBack} />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Prädiktive Gesundheitsanalyse</h1>
                <div className={`p-4 rounded-lg mb-6 ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}>
                    <h2 className="font-bold text-lg">{statusInfo.title}</h2>
                    <p className="text-sm">{healthData.analysisText}</p>
                </div>
                <div className="mt-6 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Proaktive Empfehlungen</h3>
                        {recommendations && (
                           <button onClick={handlePlayTts} disabled={isTtsLoading} className="flex items-center space-x-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7.16 3.08A7.25 7.25 0 1 0 12.84 16.92A7.25 7.25 0 0 0 7.16 3.08ZM10 18a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5Z" /><path d="M10 5.5a.75.75 0 0 0-1.5 0v5.69l-1.97-1.97a.75.75 0 1 0-1.06 1.06l3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L11.5 11.19V5.5a.75.75 0 0 0-1.5 0Z" /></svg>
                               <span>{isTtsLoading ? "Spielt..." : "Anhören"}</span>
                           </button>
                        )}
                    </div>
                    {isLoading && <Loader text="Analysiere und generiere Ratschläge..." />}
                    {!isLoading && !recommendations && (
                        <button onClick={handleGenerateRecommendations} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 clickable-card">
                            <span>✨ Empfehlungen generieren</span>
                        </button>
                    )}
                    {recommendations && (
                         <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: recommendations.replace(/\n/g, '<br />') }}></div>
                    )}
                </div>
            </div>
        </main>
    );
};

const AICoachView: React.FC<{ healthData: HealthData; onBack: () => void; }> = ({ healthData, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hallo! Ich bin Ihr AI-Gesundheitscoach. Wie kann ich Ihnen heute helfen?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMessage: ChatMessage = { role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        const response = await getCoachResponse(newMessages, healthData);
        setMessages([...newMessages, { role: 'model', text: response }]);
        setIsLoading(false);
    };

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full h-[calc(100vh-4rem)] flex flex-col">
            <div className="bg-white p-6 rounded-lg shadow flex flex-col flex-grow">
                <BackButton onClick={onBack} />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Coach</h1>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4 mb-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white flex-shrink-0">AI</div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2">
                             <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white flex-shrink-0">AI</div>
                             <div className="max-w-md p-3 rounded-lg bg-gray-200 text-gray-800">
                                 <div className="flex gap-1.5">
                                     <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                                     <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                                     <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
                                 </div>
                             </div>
                        </div>
                    )}
                    <div ref={chatEndRef}></div>
                </div>
                <div className="flex items-center border-t pt-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Schreiben Sie eine Nachricht..."
                        className="flex-grow border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading} className="ml-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .95.53l4.95-1.414a.75.75 0 0 0-.424-1.455L4.303 6.28l-1.198-4.192ZM13.895 17.711a.75.75 0 0 0 .826-.95l-1.414-4.949a.75.75 0 0 0-.95-.53l-4.95 1.414a.75.75 0 0 0 .424 1.455l3.703-1.058 1.198 4.192Z" /><path d="M8.845 6.43a.75.75 0 0 0-1.06 1.061l1.64 1.64a.75.75 0 0 0 1.06 0l1.64-1.64a.75.75 0 0 0-1.06-1.061L10 7.492l-1.155-1.062Z" /></svg>
                    </button>
                </div>
            </div>
        </main>
    );
};

const ReportAndShareView: React.FC<{ view: 'report' | 'share'; healthData: HealthData; onBack: () => void; }> = ({ view, healthData, onBack }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setSummary('');
        const result = await generateWeeklySummary(healthData);
        setSummary(result);
        setIsLoading(false);
    };
    
    const handleCopyToClipboard = () => {
        const textToCopy = `Wöchentlicher Gesundheitsbericht:\n\n${summary || 'Zusammenfassung nicht generiert.'}\n\nDurchschnittswerte:\n- Score: ${healthData.score}/100\n- Schritte: ${healthData.steps.toLocaleString('de-DE')}\n- Schlaf: ${healthData.sleepHours}h`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Bericht in die Zwischenablage kopiert!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <div className="bg-white p-6 rounded-lg shadow">
                <BackButton onClick={onBack} />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{view === 'report' ? 'Gesundheitsbericht' : 'Bericht teilen'}</h1>
                
                {view === 'report' && (
                    <div className="space-y-4">
                        <p className="text-gray-600">Generieren Sie hier Ihre wöchentliche KI-Zusammenfassung.</p>
                        <div className="border-t pt-4">
                            {!isLoading && !summary && (
                                <button onClick={handleGenerateSummary} className="flex items-center space-x-2 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 clickable-card">
                                    <span>✨ Woche zusammenfassen</span>
                                </button>
                            )}
                             {isLoading && <Loader text="Zusammenfassung wird generiert..." />}
                             {summary && (
                                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold mb-2">KI-Wochenübersicht</h3>
                                    <p>{summary}</p>
                                </div>
                             )}
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 pt-4 border-t">Wöchentliche Aktivität</h2>
                        <div className="h-64 bg-gray-50 rounded-lg"><BarChart data={[{ name: "Schritte", value: healthData.steps / healthData.stepsGoal * 100, color: '#22c55e'}, {name: "Aktiv", value: healthData.active/60 * 100, color: '#0ea5e9'}]} /></div>
                    </div>
                )}

                {view === 'share' && (
                    <div className="space-y-4">
                        <p className="text-gray-600">Teilen Sie eine Zusammenfassung Ihres aktuellen Status oder Ihres Wochenberichts.</p>
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h3 className="font-semibold">Aktueller Status</h3>
                            <p className="text-sm text-gray-700">{healthData.analysisText}</p>
                        </div>
                        <button onClick={handleCopyToClipboard} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gray-700 text-white font-medium py-2 px-6 rounded-lg hover:bg-gray-800">
                           <span>Bericht kopieren</span>
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
};

const WatchView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="bg-white p-6 rounded-lg shadow">
            <BackButton onClick={onBack} />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Smartwatch-Einstellungen</h1>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Status</span>
                    <span className="text-green-600 font-semibold">Verbunden (Demo Watch 1)</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Automatische Synchronisierung</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" defaultChecked name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                </div>
                 <button className="w-full text-red-600 font-medium py-2 px-4 rounded-lg hover:bg-red-50">
                    Gerät trennen
                </button>
            </div>
        </div>
    </main>
);

const DetailView: React.FC<{ type: DetailViewType; healthData: HealthData; onBack: () => void; }> = ({ type, healthData, onBack }) => {
    const details = {
        hr: { title: "Herzfrequenz", value: healthData.hr, unit: "BPM", chartData: generateHeartRateData(healthData.hr, healthData.hrMin, healthData.hrMax), color: "#ef4444", yDomain: [40, 160] },
        bp: { title: "Blutdruck", value: healthData.bp, unit: "mmHg", chartData: generateGenericMetricData(120), color: "#3b82f6", yDomain: [60, 180] },
        spo2: { title: "SpO2", value: healthData.spo2, unit: "%", chartData: generateGenericMetricData(healthData.spo2, 0.02), color: "#14b8a6", yDomain: [90, 100] },
        temp: { title: "Temperatur", value: healthData.temp, unit: "°C", chartData: generateGenericMetricData(healthData.temp, 0.01), color: "#f97316", yDomain: [35, 39] },
        steps: { title: "Schritte", value: healthData.steps.toLocaleString('de-DE'), unit: "", chartData: generateGenericMetricData(healthData.steps, 0.8), color: "#22c55e", yDomain: [0, healthData.stepsGoal * 1.5] },
        calories: { title: "Kalorien", value: healthData.calories.toLocaleString('de-DE'), unit: "kcal", chartData: generateGenericMetricData(healthData.calories, 0.7), color: "#f97316", yDomain: [0, 3000] },
        active: { title: "Aktive Minuten", value: healthData.active, unit: "Min", chartData: generateGenericMetricData(healthData.active, 1.2), color: "#0ea5e9", yDomain: [0, 120] },
        distance: { title: "Distanz", value: healthData.distance, unit: "km", chartData: generateGenericMetricData(healthData.distance, 0.8), color: "#8b5cf6", yDomain: [0, 10] },
        sleep: { title: "Schlaf", value: healthData.sleepHours, unit: "Stunden", chartData: generateSleepData(healthData.sleepHours) },
        // FIX: Use .map directly on the array instead of Object.entries to avoid type errors.
        score: { title: "Gesundheitsscore", value: healthData.score, unit: "/ 100", chartData: healthData.radarData.map(item => ({name: item.axis, value: item.value * 100, color: "#a855f7"})) },
    }[type];

    return (
         <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <div className="bg-white p-6 rounded-lg shadow">
                <BackButton onClick={onBack} />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{details.title}</h1>
                 <p className="text-4xl font-bold text-gray-900 mb-2">{details.value} <span className="text-2xl font-medium text-gray-500">{details.unit}</span></p>
                <div className="h-80 bg-gray-50 rounded-lg p-4 mt-4">
                    {type === 'score' || type === 'sleep' ?
                        <BarChart data={details.chartData as { name: string; value: number; color: string }[]} /> :
                        <LineChart data={details.chartData as any} color={details.color || '#000'} yDomain={details.yDomain as [number, number]}/>
                    }
                </div>
            </div>
        </main>
    );
};

const SettingsView: React.FC<{ 
    initialView: View;
    healthData: HealthData;
    profileData: ProfileData;
    onHealthDataUpdate: (data: Partial<HealthData>) => void;
    onProfileUpdate: (data: ProfileData) => void;
    onNavigate: (view: View) => void;
}> = ({ initialView, healthData, profileData, onHealthDataUpdate, onProfileUpdate, onNavigate }) => {
    const [settingsView, setSettingsView] = useState(initialView);
    const [currentHealthData, setCurrentHealthData] = useState(healthData);
    const [currentProfileData, setCurrentProfileData] = useState(profileData);

    useEffect(() => {
        setCurrentHealthData(healthData);
        setCurrentProfileData(profileData);
    }, [healthData, profileData]);

    const handleSaveDemo = () => {
        onHealthDataUpdate(currentHealthData);
        onNavigate('dashboard');
    };
    
    const handleSaveProfile = () => {
        onProfileUpdate(currentProfileData);
        setSettingsView('settings');
    }

    if (settingsView === 'demo-mode') {
        return (
             <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                <div className="bg-white p-6 rounded-lg shadow">
                    <BackButton onClick={() => setSettingsView('settings')} text="Zurück zu Einstellungen" />
                    <h1 className="text-2xl font-bold text-gray-900">Demo-Daten Simulator</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {Object.keys(healthData).filter(k => typeof (healthData as any)[k] === 'number').map(key => (
                            <div key={key}>
                                <label htmlFor={`demo-${key}`} className="block text-sm font-medium text-gray-700 capitalize">{key}</label>
                                <input type="number" id={`demo-${key}`} value={(currentHealthData as any)[key]} onChange={e => setCurrentHealthData(d => ({...d, [key]: parseFloat(e.target.value) || 0 }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                            </div>
                        ))}
                         <div>
                            <label htmlFor="demo-bp" className="block text-sm font-medium text-gray-700">Blutdruck (z.B. 118/78)</label>
                            <input type="text" id="demo-bp" value={currentHealthData.bp} onChange={e => setCurrentHealthData(d => ({...d, bp: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                    </div>
                     <button onClick={handleSaveDemo} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Speichern & Simulieren</button>
                </div>
            </main>
        )
    }
    
    if (settingsView === 'profile-settings') {
         return (
             <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                <div className="bg-white p-6 rounded-lg shadow">
                     <BackButton onClick={() => setSettingsView('settings')} text="Zurück zu Einstellungen" />
                     <h1 className="text-2xl font-bold text-gray-900">Profil bearbeiten</h1>
                     <div className="space-y-4 mt-4">
                         <div>
                             <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">Name</label>
                             <input type="text" id="profile-name" value={currentProfileData.name} onChange={e => setCurrentProfileData(p => ({...p, name: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                              <div>
                                 <label htmlFor="profile-age" className="block text-sm font-medium text-gray-700">Alter</label>
                                 <input type="number" id="profile-age" value={currentProfileData.age} onChange={e => setCurrentProfileData(p => ({...p, age: parseInt(e.target.value) || 0}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                             </div>
                              <div>
                                 <label htmlFor="profile-height" className="block text-sm font-medium text-gray-700">Größe (cm)</label>
                                 <input type="number" id="profile-height" value={currentProfileData.height} onChange={e => setCurrentProfileData(p => ({...p, height: parseInt(e.target.value) || 0}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                             </div>
                              <div>
                                 <label htmlFor="profile-weight" className="block text-sm font-medium text-gray-700">Gewicht (kg)</label>
                                 <input type="number" id="profile-weight" value={currentProfileData.weight} onChange={e => setCurrentProfileData(p => ({...p, weight: parseInt(e.target.value) || 0}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                             </div>
                         </div>
                     </div>
                     <button onClick={handleSaveProfile} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Profil speichern</button>
                </div>
            </main>
        )
    }

    if (settingsView === 'notifications-settings') {
         return (
             <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                <div className="bg-white p-6 rounded-lg shadow">
                     <BackButton onClick={() => setSettingsView('settings')} text="Zurück zu Einstellungen" />
                     <h1 className="text-2xl font-bold text-gray-900">Benachrichtigungen</h1>
                     <div className="space-y-4 mt-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span className="font-medium">Wochenbericht</span><input type="checkbox" defaultChecked className="toggle-checkbox" /></div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span className="font-medium">Anormaler Puls</span><input type="checkbox" defaultChecked className="toggle-checkbox" /></div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span className="font-medium">Bewegungserinnerung</span><input type="checkbox" className="toggle-checkbox" /></div>
                     </div>
                </div>
            </main>
        )
    }

    if (settingsView === 'privacy-settings') {
         return (
             <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                <div className="bg-white p-6 rounded-lg shadow">
                     <BackButton onClick={() => setSettingsView('settings')} text="Zurück zu Einstellungen" />
                     <h1 className="text-2xl font-bold text-gray-900">Datenschutz & Sicherheit</h1>
                      <div className="space-y-4 mt-4">
                         <button className="w-full text-left font-medium p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">Daten exportieren</button>
                         <button className="w-full text-left font-medium p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">Passwort ändern</button>
                         <button className="w-full text-left font-medium p-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">Konto löschen</button>
                     </div>
                </div>
            </main>
        )
    }
    
    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <div className="bg-white p-6 rounded-lg shadow">
                 <BackButton onClick={() => onNavigate('dashboard')} />
                <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
                <div className="space-y-2 mt-4">
                    <button onClick={() => setSettingsView('profile-settings')} className="w-full text-left p-3 hover:bg-gray-100 rounded-lg">Profil bearbeiten</button>
                    <button onClick={() => setSettingsView('notifications-settings')} className="w-full text-left p-3 hover:bg-gray-100 rounded-lg">Benachrichtigungen</button>
                    <button onClick={() => setSettingsView('privacy-settings')} className="w-full text-left p-3 hover:bg-gray-100 rounded-lg">Datenschutz & Sicherheit</button>
                    <button onClick={() => setSettingsView('demo-mode')} className="w-full text-left p-3 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg">Demo-Daten Simulator</button>
                </div>
            </div>
        </main>
    )
};
