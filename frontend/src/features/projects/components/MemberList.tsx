// features/projects/components/MemberList.tsx
// Displays a list of project members with email, full name and role.

import { type ProjectMember } from "../api/projectsApi";

interface MemberListProps {
    members: ProjectMember[];
}

export function MemberList({ members }: MemberListProps) {
    if (members.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No members yet.
            </p>
        );
    }

    return (
        <div className="rounded-md border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">Name</th>
                        <th className="px-4 py-2 text-left font-medium">Email</th>
                        <th className="px-4 py-2 text-left font-medium">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <tr key={member.userId} className="border-b last:border-0">
                            <td className="px-4 py-2">{member.fullName}</td>
                            <td className="px-4 py-2 text-muted-foreground">
                                {member.email}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                                {new Date(member.joinedAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
