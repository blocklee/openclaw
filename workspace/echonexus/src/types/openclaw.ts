// OpenClaw 集成类型定义

export interface EchoSkillMetadata {
  echoContractAddress: string;
  tokenId: string;
  chainId: number;
  permissionType: 'ownership' | 'rental' | 'extension';
}

export interface OpenClawSkill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  echoMetadata?: EchoSkillMetadata;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface OpenClawExecutionRequest {
  skillId: string;
  input: Record<string, any>;
  userId: string;
}

export interface OpenClawExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTimeMs: number;
}

export interface EchoPermissionCheckRequest {
  tokenId: string;
  userAddress: string;
  right: 'usage' | 'derivative' | 'extension';
  sceneAddress?: string;
}
