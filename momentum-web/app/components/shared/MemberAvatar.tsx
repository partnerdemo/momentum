import React from 'react';
import {
    getInitials,
    getAvatarStyles,
    validateColor,
    getContrastingTextColor,
    type MemberAvatarProps,
} from 'momentum-shared';

export default function MemberAvatar({
    name,
    color,
    size,
    showName = false,
    fontSize,
    style,
}: MemberAvatarProps) {
    const validColor = validateColor(color);
    const avatarStyles = getAvatarStyles(validColor, size);
    const textColor = getContrastingTextColor(validColor);
    const initials = getInitials(name);

    return (
        <div className="flex items-center gap-2">
            <div
                className="flex items-center justify-center font-bold shadow-sm"
                style={{
                    backgroundColor: avatarStyles.backgroundColor,
                    width: `${avatarStyles.width}px`,
                    height: `${avatarStyles.height}px`,
                    borderRadius: `${avatarStyles.borderRadius}px`,
                    fontSize: `${fontSize || avatarStyles.fontSize}px`,
                    color: textColor,
                    ...style,
                }}
                title={name}
            >
                {initials}
            </div>
            {showName && (
                <span className="text-sm font-medium text-text-primary">{name}</span>
            )}
        </div>
    );
}
