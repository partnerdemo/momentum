import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { Task, Quest, Member, StoreItem, Meal, Restaurant, Routine, WishlistItem, Household, Event } from '../types';

interface DataContextType {
  tasks: Task[]; quests: Quest[]; members: Member[]; household: Household | null;
  storeItems: StoreItem[]; meals: Meal[]; restaurants: Restaurant[];
  routines: Routine[]; wishlistItems: WishlistItem[]; events: Event[];
  householdId: string; isInitialLoad: boolean; isRefreshing: boolean;
  refresh: () => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  updateRoutine: (routineId: string, updates: Partial<Routine>) => void;
  updateWishlistItem: (itemId: string, updates: Partial<WishlistItem>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { on, off } = useSocket();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const householdId = household?.id || household?._id || '';

  const loadAllData = useCallback(async (silent = false) => {
    try {
      if (!silent) logger.info('Loading all app data...');
      const response = await api.getDashboardData();
      if (response.data) {
        const d = response.data;
        const normalizeId = <T extends { id?: string; _id?: string }>(item: T): T & { id: string } => ({
          ...item,
          id: item.id || item._id || ''
        });

        if (d.tasks) setTasks(d.tasks.map(normalizeId));
        if (d.quests) setQuests(d.quests.map(normalizeId));
        if (d.storeItems) setStoreItems(d.storeItems.map(normalizeId));
        if (d.meals) setMeals(d.meals.map(normalizeId));
        if (d.restaurants) setRestaurants(d.restaurants.map(normalizeId));
        if (d.routines) setRoutines(d.routines.map(normalizeId));
        if (d.wishlistItems) setWishlistItems(d.wishlistItems.map(normalizeId));
        if (d.events) setEvents(d.events.map(normalizeId));
        if (d.household) {
          const normalizedMembers = d.household.members ? d.household.members.map(normalizeId) : [];
          setHousehold({
            ...d.household,
            id: d.household.id || d.household._id || '',
            members: normalizedMembers
          });
          setMembers(normalizedMembers);
        }
      }
      api.getGoogleCalendarEvents().catch((err) => {
        logger.error('Background Google Calendar fetch failed:', err);
      });
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setIsInitialLoad(false); setIsRefreshing(false);
    }
  }, []);

  const updateTask = useCallback((id: string, u: Partial<Task>) => { setTasks(p => p.map(t => t.id === id ? { ...t, ...u } : t)); }, []);
  const updateQuest = useCallback((id: string, u: Partial<Quest>) => { setQuests(p => p.map(q => q.id === id ? { ...q, ...u } : q)); }, []);
  const updateMember = useCallback((id: string, u: Partial<Member>) => { setMembers(p => p.map(m => m.id === id ? { ...m, ...u } : m)); }, []);
  const updateRoutine = useCallback((id: string, u: Partial<Routine>) => { setRoutines(p => p.map(r => r.id === id ? { ...r, ...u } : r)); }, []);
  const updateWishlistItem = useCallback((id: string, u: Partial<WishlistItem>) => { setWishlistItems(p => p.map(i => (i.id === id ? { ...i, ...u } : i))); }, []);

  const refresh = useCallback(async () => { setIsRefreshing(true); await loadAllData(); }, [loadAllData]);

  useEffect(() => { if (isAuthenticated) loadAllData(); }, [isAuthenticated, loadAllData]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      api.getGoogleCalendarEvents().catch((err) => {
        logger.error('Interval Background Google Calendar fetch failed:', err);
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Granular task handler: patch only the changed task instead of refetching everything
    const onTaskUpdated = (payload: { type?: string; task?: any; taskId?: string; memberUpdate?: any }) => {
      const normalizedTask = payload.task ? { ...payload.task, id: payload.task.id || payload.task._id } : null;
      const targetId = payload.taskId || (normalizedTask ? normalizedTask.id : '');

      if (payload.type === 'create' && normalizedTask) {
        setTasks(prev => {
          const exists = prev.some(t => t.id === normalizedTask.id);
          return exists ? prev : [normalizedTask, ...prev];
        });
      } else if (payload.type === 'delete' && targetId) {
        setTasks(prev => prev.filter(t => t.id !== targetId));
      } else if (normalizedTask) {
        setTasks(prev => {
          const exists = prev.some(t => t.id === normalizedTask.id);
          if (exists) return prev.map(t => t.id === normalizedTask.id ? { ...t, ...normalizedTask } : t);
          return [normalizedTask, ...prev]; // new task arrived via update event
        });
      }
      // Patch member points inline if the payload includes an update
      if (payload.memberUpdate) {
        const { memberId, ...updates } = payload.memberUpdate;
        if (memberId) updateMember(String(memberId), updates);
      }
    };

    // member_updated carries a targeted patch — no full reload needed
    const onMemberUpdated = (payload: { memberId?: string; [key: string]: any }) => {
      if (payload.memberId) {
        const { memberId, timestamp, ...updates } = payload;
        updateMember(String(memberId), updates);
      }
    };

    // Structural changes (household membership, quests, store, routines, wishlist, events)
    // still trigger a silent full reload since their payloads aren't granular enough yet
    const reload = () => loadAllData(true);

    on('taskUpdated', onTaskUpdated);
    on('member_updated', onMemberUpdated);
    const fullReloadEvents = ['questUpdated', 'storeUpdated', 'routine_updated', 'wishlist_updated', 'household_updated', 'event_updated'];
    fullReloadEvents.forEach(e => on(e, reload));

    return () => {
      off('taskUpdated', onTaskUpdated);
      off('member_updated', onMemberUpdated);
      fullReloadEvents.forEach(e => off(e, reload));
    };
  }, [isAuthenticated, on, off, loadAllData, updateMember]);

  return (
    <DataContext.Provider value={{ tasks, quests, members, household, storeItems, meals, restaurants, routines, wishlistItems, events, householdId, isInitialLoad, isRefreshing, refresh, updateTask, updateQuest, updateMember, updateRoutine, updateWishlistItem }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() { const c = useContext(DataContext); if (!c) throw new Error('useData must be used within DataProvider'); return c; }
