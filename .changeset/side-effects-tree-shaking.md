---
"@jsdevlab/bem": patch
---

Add `sideEffects: false` to the published package so bundlers can tree-shake unused exports. The build output is regenerated with Rslib 1.0; there are no API changes.
