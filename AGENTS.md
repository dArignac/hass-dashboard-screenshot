## Terminal Execution Rules

- Never chain or combine shell commands into a single execution line.
- Do NOT use command separators or chaining operators such as `&&`, `;`, `||`, or `|`.
- Do NOT use nested execution techniques such as `$(...)`, `` `...` ``, or multi-line command blocks (`\`).
- Run exactly one atomic command per terminal tool invocation.
- For multi-step workflows (e.g., git checkout, add, commit), invoke the shell execution tool separately for each command, waiting for the output of each before
  calling the next.
