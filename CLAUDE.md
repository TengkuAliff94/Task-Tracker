## Second brain (Obsidian vault)

- **Start of session:** read `C:\Users\TengkuAliff\Code\Obsidian\Projects\Task Tracker\Task Tracker.md` and the newest entries in `Log.md` beside it, then `HANDOFF.md` in this repo. If they disagree with this repo, trust the repo and fix the note.
- **End of session:** add a dated entry at the top of that `Log.md` (did, decided, problems, next), then update the note's Status, Next steps, Key decisions and Gotchas as needed.
- Vault rules: `C:\Users\TengkuAliff\Code\Obsidian\How Claude uses this vault.md`. Never write secrets to the vault.

## Shell on Windows

- **Bash commands over ~6,000 characters get cut off.** The symptom is `exit 2: …: -c: line N: unexpected EOF while looking for matching `''`, with N partway through the script. It isn't a quoting bug, so don't re-escape and retry. Write long scripts to the scratchpad with the Write tool and run them with `python -I <file>`, or make the change with Edit. Keep heredocs short.
- **Avoid `$'\r'` inside `"$(…)"`.** To find CR line endings, use `git ls-files --eol <files>` (see HANDOFF.md, Python CRLF gotcha).
