# Maestro flows

Mobile e2e via [Maestro](https://maestro.mobile.dev).

```bash
# install (once)
curl -Ls https://get.maestro.mobile.dev | bash

# run all flows against simulator/device
maestro test apps/mobile/.maestro/flows

# run one
maestro test apps/mobile/.maestro/flows/home.yaml

# CI
maestro cloud apps/mobile/.maestro/flows  # requires MAESTRO_CLOUD_API_KEY
```

The app must be installed on the target device before running. Build via:

```bash
cd apps/mobile && bunx eas build --profile development --platform ios --local
```
