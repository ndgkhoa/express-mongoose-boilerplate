export default {
  /**
   * Extends the official Conventional Commits rule set.
   * https://www.conventionalcommits.org/
   */
  extends: ["@commitlint/config-conventional"],

  rules: {
    /**
     * Restricts commit types to a predefined list.
     * This keeps commit history consistent and predictable.
     */
    "type-enum": [
      2, // Severity: 2 = error (commit will be rejected)
      "always",
      [
        "feat", // New features
        "fix", // Bug fixes
        "docs", // Documentation changes only
        "style", // Formatting, missing semicolons, etc (no logic change)
        "refactor", // Code restructuring without behavior change
        "test", // Adding or updating tests
        "chore", // Tooling, config, or maintenance tasks
        "ci", // CI/CD configuration changes
        "perf", // Performance improvements
        "build", // Build system or dependency changes
        "release", // Release-related commits
        "workflow", // GitHub Actions or workflow changes
        "security" // Security patches and fixes
      ]
    ],

    /**
     * Allows longer commit bodies for detailed explanations.
     * Set to warning (0) instead of error to stay flexible.
     */
    "body-max-length": [0, "always", 500],

    /**
     * Prevents excessively long commit headers.
     * Helps keep logs readable in GitHub, GitLab, and CI tools.
     */
    "header-max-length": [0, "always", 200]
  }
};
