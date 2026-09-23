import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { profileAPI, subjectsAPI, healthAPI } from '../api';
import toast from 'react-hot-toast';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [graniteConfigured, setGraniteConfigured] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await profileAPI.get();
      setProfile(data.profile);
      return data.profile;
    } catch (err) {
      console.error('Failed to load profile:', err.message);
      return null;
    }
  }, []);

  const loadSubjects = useCallback(async (profileId) => {
    if (!profileId) return;
    try {
      const data = await subjectsAPI.list(profileId);
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err.message);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const data = await healthAPI.check();
      setGraniteConfigured(data.granite_configured);
    } catch {
      setGraniteConfigured(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkHealth();
      const p = await loadProfile();
      if (p) await loadSubjects(p.id);
      setLoading(false);
    };
    init();
  }, [loadProfile, loadSubjects, checkHealth]);

  const refreshSubjects = useCallback(() => {
    if (profile?.id) loadSubjects(profile.id);
  }, [profile, loadSubjects]);

  const createProfile = async (data) => {
    const result = await profileAPI.create(data);
    setProfile(result.profile);
    return result.profile;
  };

  const updateProfile = async (id, data) => {
    const result = await profileAPI.update(id, data);
    setProfile(result.profile);
    return result.profile;
  };

  return (
    <AppContext.Provider value={{
      profile,
      subjects,
      loading,
      graniteConfigured,
      loadProfile,
      loadSubjects,
      refreshSubjects,
      createProfile,
      updateProfile,
      setProfile,
      setSubjects,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
