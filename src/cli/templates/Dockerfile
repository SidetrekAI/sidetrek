## Start from the official Python 3.10 image on Debian 12 (Bookworm)
FROM python:3.10-slim-bookworm as base

# Constants
# NOTES: make sure POETRY_VERSION is same as local poetry version
ENV ROOT_DIR=/app
ENV VENV=/venv

ARG PROJECT_DIRNAME
ARG POETRY_VERSION
ENV PROJECT_DIRNAME=$PROJECT_DIRNAME
ENV POETRY_VERSION=$POETRY_VERSION
ENV DAGSTER_DIRNAME=dagster
ENV DAGSTER_HOME=$ROOT_DIR/$PROJECT_DIRNAME/$DAGSTER_DIRNAME/$PROJECT_DIRNAME
ENV MELTANO_DIRNAME=meltano
ENV DBT_DIRNAME=dbt

# Install essential packages
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  build-essential \
  git \
  nano \
  wget \
  curl && \
  apt-get clean

## BUILD STAGE
FROM base as build

# Set working directory
WORKDIR $ROOT_DIR

# Configure poetry
ENV POETRY_HOME=/opt/poetry \
  POETRY_CACHE_DIR=/opt/.cache \
  POETRY_NO_INTERACTION=1 \
  POETRY_VIRTUALENVS_CREATE=false

# Prepend poetry & venv to path
ENV PATH="$POETRY_HOME/bin:$VENV/bin:$PATH"

# Set python path
ENV PYTHONPATH="$ROOT_DIR:$PYTHONPATH"

# Install poetry separate from system interpreter
RUN python3 -m venv $VENV \
  && $VENV/bin/pip install -U pip setuptools \
  && $VENV/bin/pip install poetry==$POETRY_VERSION

# Set up the working directory
WORKDIR $ROOT_DIR

# Copy project dependencies
COPY pyproject.toml poetry.lock ./

# Install project dependencies
RUN poetry install --no-dev --no-root

## PRODUCTION STAGE
FROM base as production

# Set working directory and prepend venv
WORKDIR $ROOT_DIR

# Prepend venv
ENV PATH="$VENV/bin:$PATH"

# Copy built venv and project files
COPY --from=build $VENV $VENV
COPY ./$PROJECT_DIRNAME $ROOT_DIR/$PROJECT_DIRNAME

# Copy root .env to dagster and meltano dirs
COPY ./.env $ROOT_DIR/$PROJECT_DIRNAME/$MELTANO_DIRNAME/$PROJECT_DIRNAME/.env
COPY ./.env $ROOT_DIR/$PROJECT_DIRNAME/$DAGSTER_DIRNAME/$PROJECT_DIRNAME/.env

# Start Container
CMD cd $ROOT_DIR/$PROJECT_DIRNAME/$MELTANO_DIRNAME && meltano install && \
  cd $ROOT_DIR/$PROJECT_DIRNAME/$DAGSTER_DIRNAME/$PROJECT_DIRNAME && \
  DAGSTER_DBT_PARSE_PROJECT_ON_LOAD=1 dagster dev -h 0.0.0.0 -p 3000