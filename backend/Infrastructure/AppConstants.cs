// Infrastructure/AppConstants.cs
// Named constants to eliminate magic strings throughout the codebase.
// Rule: No magic values — use named constants, enums, or configuration. (CONVENTIONS.md)

namespace Backend.Infrastructure;

/// <summary>
/// Application-wide named constants.
/// Eliminates magic strings for claim types, route names, and shared string values.
/// </summary>
public static class AppConstants
{
    /// <summary>JWT claim type constants.</summary>
    public static class Claims
    {
        /// <summary>
        /// The "sub" (subject) claim — stores the authenticated user's integer ID.
        /// Matches the value written by JwtTokenService and read by ClaimsPrincipalExtensions.
        /// </summary>
        public const string UserId = "sub";
    }

    /// <summary>Named route constants for use in WithName() and link generation.</summary>
    public static class Routes
    {
        // Auth
        public const string RegisterUser = "RegisterUser";
        public const string LoginUser = "LoginUser";
        public const string GetCurrentUser = "GetCurrentUser";
        public const string RefreshToken = "RefreshToken";

        // Projects
        public const string GetProjects = "GetProjects";
        public const string CreateProject = "CreateProject";
        public const string GetProjectDetail = "GetProjectDetail";
        public const string UpdateProject = "UpdateProject";
        public const string DeleteProject = "DeleteProject";
        public const string AddProjectMember = "AddProjectMember";

        // Tasks
        public const string GetProjectTasks = "GetProjectTasks";
        public const string CreateTask = "CreateTask";
        public const string GetTaskDetail = "GetTaskDetail";
        public const string UpdateTask = "UpdateTask";
        public const string UpdateTaskStatus = "UpdateTaskStatus";
        public const string AssignTask = "AssignTask";
        public const string DeleteTask = "DeleteTask";

        // Comments
        public const string GetTaskComments = "GetTaskComments";
        public const string CreateComment = "CreateComment";
        public const string DeleteComment = "DeleteComment";

        // Dashboard
        public const string GetMyDashboardStats = "GetMyDashboardStats";
        public const string GetMyTasks = "GetMyTasks";
    }
}
