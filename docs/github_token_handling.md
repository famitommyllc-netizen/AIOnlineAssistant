# GitHub Token Handling (Local Only)

This document intentionally does not store any token value.

## Immediate action if a token was exposed

1. Open GitHub `Settings` -> `Developer settings` -> `Personal access tokens`.
2. Delete the exposed token.
3. Generate a new fine-grained token for `famitommyllc-netizen/AIOnlineAssistant`.
4. Set `Repository permissions` -> `Contents: Read and write`.

## Safe usage for git push

1. Keep token storage in macOS Keychain, not in repo files.
2. Run:

```bash
git config --global credential.helper osxkeychain
git push origin HEAD
```

3. At prompt:
   - `Username`: your GitHub username
   - `Password`: your PAT

## Optional local file (ignored by git)

If you still need a memo file, use `docs/.github_token.local`.
It is ignored by git via `.gitignore`.
