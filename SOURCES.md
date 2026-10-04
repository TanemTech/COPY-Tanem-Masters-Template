# TANEM Master Template — Verified Sources

Verified before integration on 2026-09-19.

## Current mechanics rule

For all new changes and refinements after this point, `ichAEY/Shablon-Hair-Master` is the only approved mechanics reference. Do not copy or invent mechanics from Nina, ClayTone, Esmeralda or other client repositories.

The older sections below are retained only as historical provenance for mechanics that were already integrated and tested before this rule was approved. They are not sources for future changes.

## Base design + service structures + Hair mobile decoration
Repository: `ichAEY/Shablon-Hair-Master`
Verified commit: `d9ce7e2cd6fa16ad900fce2568b584cbc5a84481`
Use only:
- overall visual baseline;
- mobile/desktop service layouts;
- service variants;
- simple services with/without descriptions;
- 3+ category presentation;
- Hair mobile hero decoration;
- known-experience presentation.

## Historical: Nails + exactly two categories — not an approved current mechanics source
Repository: `ichAEY/claytone-current`
Verified latest commit: `89647b7d61ebcdfd43f74de2afa4d81b3dfb0194`
Historical provenance only. Do not copy mechanics from this repository into new template changes.

Important: `nonna.tanem.ru` must not be sourced from the similarly named old Nonna repositories. The current production lineage uses `claytone-current`.

## Historical: Nina reference — not an approved current mechanics source
Repository: `ichAEY/nina-ayzenberg`
Verified latest commit: `d3674862792bce14a8cc245a04b9d2cdc8154772`
Its Pages workflow builds from:
- `ichAEY/claytone-current@ce1bd42b44e76e1851af9e069c4cbcf06fc8eac2`
- `ichAEY/tanem-master-template-v1@2c3590bdb8d4163532d126d67f27be1469a426c5`

Historical provenance only. Nina is not an approved source for current mechanics. Never copy Nina client data.

## Historical: Esmeralda language/contact reference — not an approved current mechanics source
Repository: `ichAEY/Beauty-Room-by-Esmeralda`
Verified latest commit: `d7c490e905157ab8cf719d27028ac6f876e28a70`
Historical provenance only. Do not copy mechanics from this repository into new template changes.


## Approved Hair asset handling
The Hair hero decoration is the exact binary file from:
`Shablon-Hair-Master@d9ce7e2cd6fa16ad900fce2568b584cbc5a84481/public/assets/yulia/tools/hero.png`.

The template workflow checks out that pinned source commit during the build and copies only that binary to:
`public/assets/template/hair-tools.png`.

This prevents approximate redrawing and prevents client-specific Hair source folders from being copied into the clean template.
