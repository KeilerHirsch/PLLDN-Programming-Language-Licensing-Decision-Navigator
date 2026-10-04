# Block 2 initial platform and ecosystem matrix

Status: **Preview / Candidate only**.

This file records PLLDN's broad first-pass classification for runtime targets, concurrency models,
C interoperability, bare-metal support, WebAssembly support, and common package/dependency tooling.

Values describe mainstream practical toolchains and ecosystems rather than every implementation.
`unknown` means the broad pass intentionally abstains instead of forcing a claim. Package/dependency
tools are ecosystem tools, not a statement that a language standards body officially endorses them.

These values are **not Reviewed evidence**. They are a transparent seed for later verification
against official specifications, manuals, toolchain documentation, and reproducible tests.

| Language | Runtime targets | Concurrency | C FFI | Bare metal | WebAssembly | Package/dependency tools |
| --- | --- | --- | --- | --- | --- | --- |
| Ada | `native`, `embedded` | `language-tasks` | yes | yes | unknown | `alire` |
| Bash | `shell` | `processes` | no | no | no | — |
| C | `native`, `embedded`, `webassembly` | `os-threads` | yes | yes | yes | `conan`, `vcpkg` |
| C++ | `native`, `embedded`, `webassembly` | `os-threads`, `async-await` | yes | yes | yes | `conan`, `vcpkg` |
| C# | `clr`, `native`, `webassembly`, `mobile` | `os-threads`, `async-await` | yes | no | yes | `nuget` |
| Clojure | `jvm` | `os-threads` | no | no | no | `deps.edn`, `leiningen` |
| COBOL | `native` | — | yes | no | no | — |
| Dart | `native`, `javascript`, `webassembly`, `browser`, `mobile` | `async-await`, `event-loop`, `isolates` | yes | no | yes | `pub` |
| Elixir | `beam` | `lightweight-processes`, `actors` | yes | no | no | `mix`, `hex` |
| Erlang | `beam` | `lightweight-processes`, `actors` | yes | no | no | `rebar3`, `hex` |
| F# | `clr`, `native`, `webassembly` | `os-threads`, `async-await`, `actors` | yes | no | yes | `nuget` |
| Fortran | `native` | `os-threads` | yes | unknown | unknown | `fpm` |
| Go | `native`, `webassembly` | `goroutines`, `channels` | yes | yes | yes | `go-modules` |
| Haskell | `native`, `webassembly` | `green-threads`, `os-threads` | yes | unknown | yes | `cabal`, `stack` |
| Java | `jvm` | `os-threads`, `virtual-threads` | yes | no | no | `maven`, `gradle` |
| JavaScript | `browser`, `server-runtime` | `event-loop`, `web-workers`, `worker-threads` | no | no | no | `npm`, `yarn`, `pnpm` |
| Julia | `native` | `os-threads`, `tasks`, `processes` | yes | no | unknown | `julia-pkg` |
| Kotlin | `jvm`, `native`, `javascript`, `webassembly`, `mobile` | `coroutines`, `os-threads` | yes | no | yes | `gradle`, `maven` |
| Lua | `native`, `embedded` | `coroutines` | yes | yes | unknown | `luarocks` |
| Nim | `native`, `javascript`, `embedded`, `webassembly` | `os-threads`, `async-await` | yes | yes | yes | `nimble` |
| Objective-C | `native`, `mobile` | `os-threads` | yes | no | unknown | `cocoapods`, `swiftpm` |
| OCaml | `native`, `bytecode-vm`, `webassembly` | `os-threads` | yes | no | yes | `opam` |
| Perl | `native` | `os-threads`, `processes` | yes | no | unknown | `cpan`, `cpanm` |
| PHP | `server-runtime` | `processes`, `event-loop` | yes | no | no | `composer` |
| PowerShell | `clr`, `shell` | `processes`, `os-threads` | yes | no | no | `psresourceget` |
| Python | `native`, `embedded`, `webassembly` | `os-threads`, `async-await`, `processes` | yes | no | yes | `pip`, `uv`, `poetry` |
| R | `native`, `webassembly` | `processes`, `os-threads` | yes | no | yes | `install.packages` |
| Ruby | `native`, `webassembly` | `os-threads`, `fibers`, `actors` | yes | no | yes | `rubygems`, `bundler` |
| Rust | `native`, `webassembly`, `embedded` | `os-threads`, `async-await` | yes | yes | yes | `cargo` |
| Scala | `jvm`, `javascript`, `native` | `os-threads`, `async-await`, `actors` | yes | no | unknown | `sbt`, `maven`, `gradle` |
| Solidity | `evm` | — | no | no | no | — |
| Swift | `native`, `mobile`, `embedded`, `webassembly` | `os-threads`, `async-await`, `actors` | yes | yes | yes | `swiftpm` |
| TypeScript | `javascript`, `browser`, `server-runtime` | `event-loop`, `web-workers`, `worker-threads` | no | no | no | `npm`, `yarn`, `pnpm` |
| Visual Basic .NET | `clr` | `os-threads`, `async-await` | yes | no | unknown | `nuget` |
| Zig | `native`, `webassembly`, `embedded` | `os-threads` | yes | yes | yes | `zig-build` |
