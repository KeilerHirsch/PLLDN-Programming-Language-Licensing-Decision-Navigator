# Sourced language reader profiles

Each catalogue language has a scoped reader profile covering project fit and limitations, prerequisites, execution, language behavior, tools, maintenance, costs, an example and component licenses. Open the reader disclosure on a card or follow its profile permalink. The card shows a short fit/prerequisite summary; the full reader keeps references next to the statements they support.

## Examples and evidence

Examples distinguish programs, configuration, queries, markup and reference workflows. A graphical or restricted toolchain may require a reference workflow with no executable text. Its instructions and expected result explain that limitation.

**Documented** means the workflow is backed by the cited documentation, without a PLLDN execution claim. **Execution recorded** means a maintained receipt matches the exact language, filename, code, instructions and expected result displayed. Changing any of those fields removes that status until a new run supplies matching evidence.

The fixed verifier runs the maintained JavaScript and TypeScript files in `examples/reader`, using the pinned Node.js and TypeScript versions. It compiles the TypeScript file and checks both programs' output. It never executes a command or chooses an executable path from catalogue data.

```sh
node tools/reader-examples.ts --check
```

The repository verification suite replays those examples on its supported CI platforms. The recorded date describes the receipt's original run. A successful replay verifies the same example and tools; it does not change that historical date. Other languages retain documented status.

## Component licenses

A language name is not an application license. Each entry names its selected implementation and version scope, then records compiler, runtime or standard-library terms as applicable. An unresolved expression is shown explicitly.

SPDX expressions are displayed literally. Individual known license identifiers link into the licence catalogue; an OR choice, AND combination or WITH exception is not interpreted as permission for a particular project. The source grant, covered files, exceptions and third-party notices remain part of the scope. Host products, modules, dependencies and services can have different terms and costs.

## Comparison and discovery

Any catalogue language can join the same comparison, up to four at a time. The table and CSV export share the same row definitions and source references. Unassessed identities keep UNKNOWN assessment values. Descriptive reader data does not promote a language to a Reviewed recommendation, create benchmark results or change the decision engine.

Search includes reader prerequisites, implementation names and license scope as well as the existing introductions and discovery metadata. Usage ranking, documented origins and implementation lifecycle remain independent facets.

## Maintained data contract

The static `catalog/language-reader-profiles-*.v1.json` partitions are validated together against the exact language catalogue. Missing or duplicate identities, missing sections, unsafe URLs, invalid dates, unresolved source IDs and malformed example fields fail validation.

Every descriptive section, implementation scope, example and component-license entry references its own local source IDs. The source inventory shows check dates. Descriptive records cannot declare themselves executed; execution receipts live separately in `catalog/language-reader-example-evidence.v1.json`.

These profiles are documentation-backed context. They do not certify deployment support, license compatibility, costs, performance or fitness for an individual project.
