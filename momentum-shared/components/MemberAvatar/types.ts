export interface MemberAvatarProps {
    name: string;
    color: string;
    size: number;
    showName?: boolean;
    fontSize?: number;
    style?: any; // Platform-specific style object
}

export interface AvatarStyles {
    backgroundColor: string;
    width: number;
    height: number;
    borderRadius: number;
    fontSize: number;
}
