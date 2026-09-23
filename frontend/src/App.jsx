import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Subjects from './pages/Subjects';
import ResourceLibrary from './pages/ResourceLibrary';
import UploadResource from './pages/UploadResource';
import StudyMaterial from './pages/StudyMaterial';
import AITutor from './pages/AITutor';
import StudyPlanner from './pages/StudyPlanner';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import Progress from './pages/Progress';
import Recommendations from './pages/Recommendations';

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: 13, maxWidth: 400 },
          }}
        />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/resources" element={<ResourceLibrary />} />
            <Route path="/upload" element={<UploadResource />} />
            <Route path="/study-material" element={<StudyMaterial />} />
            <Route path="/tutor" element={<AITutor />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
