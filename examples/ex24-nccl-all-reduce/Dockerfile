# SPDX-License-Identifier: Apache-2.0
FROM nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87
RUN apt-get update && apt-get install -y --no-install-recommends curl g++ make binutils ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /tmp/nccl-packages
RUN curl -fL --retry 3 -o runtime.deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/libnccl2_2.31.2-1+cuda13.3_amd64.deb \
 && curl -fL --retry 3 -o development.deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/libnccl-dev_2.31.2-1+cuda13.3_amd64.deb \
 && printf '%s\n' 'e1c743dc848afb697d8311c575e4a728e0fff84ad2d4aa73b7c8b82d9ae83868  runtime.deb' '5c3d903e1f4a0174b28f02ed714b7ccd2ddd1c23a686e93afa0dedcacdf95643  development.deb' | sha256sum -c - \
 && dpkg -i runtime.deb development.deb && rm runtime.deb development.deb
WORKDIR /project
COPY . .
RUN make host-test preprocess inspect
# No executable is run during image construction except the CPU oracle.
CMD ["make", "host-test"]
