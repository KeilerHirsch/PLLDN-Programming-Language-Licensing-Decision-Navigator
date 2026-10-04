# Block 1 initial classification matrix

Status: **Preview / Candidate only**.

This file records PLLDN's first broad classification pass for three comparison dimensions:
type-checking model, execution model, and memory-management model.

The matrix is intentionally coarse. It describes mainstream user-facing language/toolchain behavior,
not every historical implementation or every optional compiler/runtime. A set may contain multiple
common execution or memory modes. `runtime-managed` is used when application code generally does not
manage general-purpose heap lifetime directly but a more specific tracing/reference-counting/ownership
label would be misleading. `raii-deterministic-destruction` distinguishes C++-style deterministic
object lifetime from garbage collection.

These values are **not Reviewed evidence**. They are a transparent seed for later language-specific
verification against official specifications, manuals, toolchain documentation, and reproducible tests.

| Language | Type checking | Execution model | Memory management |
| --- | --- | --- | --- |
| Ada | `static` | `ahead-of-time-native` | `manual` |
| Bash | `dynamic` | `interpreter` | `runtime-managed` |
| C | `static` | `ahead-of-time-native` | `manual` |
| C++ | `static` | `ahead-of-time-native` | `manual`, `reference-counting`, `raii-deterministic-destruction` |
| C# | `static` | `ahead-of-time-native`, `bytecode-vm`, `jit` | `garbage-collected` |
| Clojure | `dynamic` | `bytecode-vm`, `jit` | `garbage-collected` |
| COBOL | `static` | `ahead-of-time-native` | `runtime-managed` |
| Dart | `static` | `ahead-of-time-native`, `jit`, `transpiled` | `garbage-collected` |
| Elixir | `dynamic` | `bytecode-vm`, `jit` | `garbage-collected` |
| Erlang | `dynamic` | `bytecode-vm`, `jit` | `garbage-collected` |
| F# | `static` | `ahead-of-time-native`, `bytecode-vm`, `jit` | `garbage-collected` |
| Fortran | `static` | `ahead-of-time-native` | `manual`, `runtime-managed` |
| Go | `static` | `ahead-of-time-native` | `garbage-collected` |
| Haskell | `static` | `ahead-of-time-native`, `interpreter` | `garbage-collected` |
| Java | `static` | `bytecode-vm`, `jit` | `garbage-collected` |
| JavaScript | `dynamic` | `interpreter`, `jit` | `garbage-collected` |
| Julia | `dynamic` | `jit` | `garbage-collected` |
| Kotlin | `static` | `ahead-of-time-native`, `bytecode-vm`, `jit`, `transpiled` | `garbage-collected` |
| Lua | `dynamic` | `interpreter`, `jit` | `garbage-collected` |
| Nim | `static` | `ahead-of-time-native`, `transpiled` | `garbage-collected`, `reference-counting` |
| Objective-C | `static`, `dynamic` | `ahead-of-time-native` | `automatic-reference-counting`, `manual`, `reference-counting` |
| OCaml | `static` | `ahead-of-time-native`, `bytecode-vm` | `garbage-collected` |
| Perl | `dynamic` | `interpreter` | `reference-counting` |
| PHP | `dynamic` | `interpreter`, `jit` | `garbage-collected`, `reference-counting` |
| PowerShell | `dynamic` | `interpreter` | `garbage-collected` |
| Python | `dynamic` | `bytecode-vm`, `interpreter` | `garbage-collected`, `reference-counting` |
| R | `dynamic` | `interpreter` | `garbage-collected` |
| Ruby | `dynamic` | `interpreter`, `jit` | `garbage-collected` |
| Rust | `static` | `ahead-of-time-native` | `ownership-borrowing` |
| Scala | `static` | `bytecode-vm`, `jit` | `garbage-collected` |
| Solidity | `static` | `bytecode-vm` | `runtime-managed` |
| Swift | `static` | `ahead-of-time-native` | `automatic-reference-counting` |
| TypeScript | `gradual` | `transpiled` | `garbage-collected` |
| Visual Basic .NET | `static`, `dynamic` | `ahead-of-time-native`, `bytecode-vm`, `jit` | `garbage-collected` |
| Zig | `static` | `ahead-of-time-native` | `manual` |
