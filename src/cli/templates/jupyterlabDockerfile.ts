import { JUPYTERLAB_CONTAINER_HOME_PATH, JUPYTERLAB_CONTAINER_VOLUME_PATH } from '@cli/constants'

const jupyterlabDockerfile = `FROM quay.io/jupyter/scipy-notebook

# Where the volume is attached to
WORKDIR ${JUPYTERLAB_CONTAINER_VOLUME_PATH}

# Add sidetrek
RUN curl -fsSL https://sidetrek.com/cli | sh
ENV PATH="$PATH:${JUPYTERLAB_CONTAINER_HOME_PATH}/.sidetrek/bin"

# Install pip-tools and upgrade pip and setuptools to prevent "python setup.py egg_info did not run successfully." error
RUN pip3 install pip-tools && pip3 install --upgrade pip setuptools

# Compile source dependencies (i.e. requirements.in) to requirements.txt and then use that to install Python dependencies
COPY ./jupyterlab/requirements.in ./requirements.in

# --no-cache-dir to prevent OOMKilled
RUN pip-compile ./requirements.in --output-file=./requirements.txt && pip install --no-cache-dir -r ./requirements.txt

# Create an ipython profile and add the custom magic commands
RUN ipython profile create 
COPY ./jupyterlab/magics/magics.py ../.ipython/profile_default/startup/01-magics.py`

export default jupyterlabDockerfile
