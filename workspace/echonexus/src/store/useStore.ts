import { create } from 'zustand';
import { EchoSkill } from '../types';

interface AppState {
  // 账户
  account: string | null;
  setAccount: (account: string | null) => void;
  
  // 技能列表
  skills: EchoSkill[];
  setSkills: (skills: EchoSkill[]) => void;
  addSkill: (skill: EchoSkill) => void;
  
  // 选中的技能
  selectedSkill: EchoSkill | null;
  setSelectedSkill: (skill: EchoSkill | null) => void;
  
  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 我的已租赁技能
  myRentedSkills: string[];
  setMyRentedSkills: (tokenIds: string[]) => void;
  addRentedSkill: (tokenId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  account: null,
  setAccount: (account) => set({ account }),
  
  skills: [],
  setSkills: (skills) => set({ skills }),
  addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
  
  selectedSkill: null,
  setSelectedSkill: (skill) => set({ selectedSkill: skill }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  myRentedSkills: [],
  setMyRentedSkills: (tokenIds) => set({ myRentedSkills: tokenIds }),
  addRentedSkill: (tokenId) => set((state) => ({ 
    myRentedSkills: [...state.myRentedSkills, tokenId] 
  })),
}));
