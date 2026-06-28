// Position types and related interfaces

export interface PositionType {
    id: number;
    title: string;
    code: string;
    category?: string;
    description?: string;
}

export interface PositionGroup {
    id: number;
    name: string;
    positions: PositionType[];
}

export type PositionCategory = 
    | 'TEACHER'           // ครู
    | 'ADMIN'            // ผู้บริหาร  
    | 'SPECIALIST'       // นักวิชาการ
    | 'SUPPORT'          // สนับสนุน
    | 'OTHER';           // อื่นๆ

export interface PositionSelectOption {
    value: string;
    label: string;
    category: PositionCategory;
    disabled?: boolean;
}

export interface OrganizationType {
    id: number;
    name: string;
    code: string;
    level: 'CENTRAL' | 'REGIONAL' | 'AREA' | 'SCHOOL' | 'OTHER';
    parentId?: number;
}

export interface AffiliationData {
    organization: OrganizationType;
    institution?: string;
    department?: string;
    level?: string;
}