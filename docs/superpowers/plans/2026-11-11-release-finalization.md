# Release Finalization Implementation Plan

**Goal:** Deliver Windows v2.5.5 draft artifacts and extend macOS customer Settings with evidence for each requested gate.
**Architecture:** Continue the existing Electron updater and SwiftUI Settings/native controller. Preserve app identifiers, userData, licensing storage and existing features. Use native GitHub runners; do not publish or push tags.
**Tech Stack:** Electron/React/TypeScript/NSIS, SwiftUI/Sparkle/Xcode, GitHub Actions.
**Spec:** Owner's release-engineering handoff supplied November 11, 2026.

## Global Constraints
- No secrets in outputs or commits; never embed signing secrets or master unlock codes.
- Windows commits on audit-finalization; macOS on a feature branch.
- No Android edits, force pushes, data deletion, OS security changes or public releases.
- Fetch and rebase before every push; stop on conflicts.
- Mark native purchase/upgrade tests NOT TESTED without real execution.

## Review Focus
- Missing or malformed checksum must prevent installation.
- Draft/prerelease metadata must not offer updates, including manual checks.
- A staged installer changed after verification must not launch.
- Auto-check preference must survive restart and gate startup/periodic checks.
- Source-only license simulations cannot prove DPAPI/Keychain or paid entitlement retention.

## Windows
- [x] Verify clean baseline and existing CI at c7f9f19.
- [ ] Add failing production-path updater tests; fix checksum fail-open, stale installer readiness and draft filtering.
- [ ] Bump package and UI to 2.5.5; retain historical release notes and append honest draft notes.
- [ ] Require npm ci; build Setup/Portable with publishing disabled; verify payload architecture/version and wrapper metadata, run Defender, generate checksums and exact ZIP contents.
- [ ] Run npm run check; commit, rebase, push branch; inspect native Actions evidence and create draft without pushing tags.
- [ ] Verify available QA-machine access; perform upgrade/rollback only with actual Windows access, otherwise document exact remaining steps.

## macOS (after Windows artifact and QA attempt)
- [ ] Extend existing Settings with native license status/activation and honest update/signing status.
- [ ] Test preference persistence, periodic-check opt-out and release metadata trust; fix controller wiring.
- [ ] Build and run Swift tests on macos-15, fixing actual failures without weakening security checks.
- [ ] Review Gumroad/Keychain/offline/revocation and Sparkle path; request real product ID, never guess.
- [ ] Commit on feature branch, rebase/push and write evidence report with all untested gates.
