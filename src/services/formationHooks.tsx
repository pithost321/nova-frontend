import { useState, useEffect, useCallback } from 'react';
import { formationsAPI } from './apiService';
import { Formation, FormationSession, FormationType, FormationStatus, SessionStatus } from '../../types';

// ============================================================================
// FORMATIONS HOOKS
// ============================================================================

/**
 * Hook to fetch all formations
 */
export const useFormations = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFormations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await formationsAPI.getAllFormations();
      setFormations(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching formations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormations();
  }, [fetchFormations]);

  return { formations, loading, error, refetch: fetchFormations };
};

/**
 * Hook to fetch a single formation by ID
 */
export const useFormation = (id: string | undefined) => {
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<Error | null>(null);

  const fetchFormation = useCallback(async () => {
    if (!id) {
      setFormation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await formationsAPI.getFormationById(id);
      setFormation(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching formation:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFormation();
  }, [fetchFormation]);

  return { formation, loading, error, refetch: fetchFormation };
};

/**
 * Hook to create a new formation
 */
export const useCreateFormation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);

  const createFormation = useCallback(async (newFormation: Formation) => {
    try {
      setLoading(true);
      const created = await formationsAPI.createFormation(newFormation);
      setFormation(created);
      setError(null);
      return created;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error creating formation:', err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createFormation, loading, error, formation };
};

/**
 * Hook to update a formation
 */
export const useUpdateFormation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);

  const updateFormation = useCallback(async (id: string, updatedFormation: Formation) => {
    try {
      setLoading(true);
      const updated = await formationsAPI.updateFormation(id, updatedFormation);
      setFormation(updated);
      setError(null);
      return updated;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error updating formation:', err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateFormation, loading, error, formation };
};

/**
 * Hook to delete a formation
 */
export const useDeleteFormation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteFormation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await formationsAPI.deleteFormation(id);
      setError(null);
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error deleting formation:', err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteFormation, loading, error };
};

// ============================================================================
// FORMATION SESSIONS HOOKS
// ============================================================================

/**
 * Hook to fetch user's formation sessions
 */
export const useMyFormationSessions = () => {
  const [sessions, setSessions] = useState<FormationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await formationsAPI.getMyFormationSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching user formation sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
};

/**
 * Hook to fetch team formation sessions
 */
export const useTeamFormationSessions = (teamId: string | undefined) => {
  const [sessions, setSessions] = useState<FormationSession[]>([]);
  const [loading, setLoading] = useState(!!teamId);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!teamId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await formationsAPI.getTeamFormationSessions(teamId);
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching team formation sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
};

/**
 * Hook to enroll in a formation
 */
export const useEnrollFormation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<FormationSession | null>(null);

  const enrollFormation = useCallback(async (formationId: string) => {
    try {
      setLoading(true);
      console.log('[useEnrollFormation] Starting enrollment for:', formationId);
      const created = await formationsAPI.enrollFormation(formationId);
      setSession(created);
      setError(null);
      console.log('[useEnrollFormation] Success:', created);
      return created;
    } catch (err: any) {
      const error = err as Error;
      setError(error);
      console.error('[useEnrollFormation] Failed:', {
        message: error.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        formationId
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { enrollFormation, loading, error, session };
};

/**
 * Hook to complete a chapter in a formation session
 */
export const useCompleteChapter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<FormationSession | null>(null);

  const completeChapter = useCallback(async (sessionId: string, chapterId: string) => {
    try {
      setLoading(true);
      const updated = await formationsAPI.completeChapter(sessionId, chapterId);
      setSession(updated);
      setError(null);
      return updated;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error completing chapter:', err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { completeChapter, loading, error, session };
};
