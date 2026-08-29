# SPDX-License-Identifier: Apache-2.0
FROM nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --yes g++-14 \
    && rm -rf /var/lib/apt/lists/*
