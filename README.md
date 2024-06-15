<div class="flex justify-center">
<img src="https://raw.githubusercontent.com/sidetrekAI/sidetrek-cli/master/.github/logo-tagline-light-svg.svg" width="50%"/>
</div>

<div class="flex justify-center">
<img src="https://img.shields.io/github/license/SidetrekAI/sidetrek-cli?color=%23866eea"/>
<img src="https://img.shields.io/github/last-commit/SidetrekAI/sidetrek-cli?color=%23ff4d84&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/python-v3.10%20%7C%20v3.11-black?logo=python&logoColor=yellow"/>
<a href="https://join.slack.com/t/sidetrek-community/shared_invite/zt-2jt7qd46b-FmqAl3WSU~2uWtAFTXjj7A"><img src="https://img.shields.io/badge/slack-white?logo=slack&logoColor=red"/></a>
<a href="https://www.linkedin.com/company/35626712"><img src="https://img.shields.io/badge/linkedin-white?logo=linkedin&logoColor=blue"/></a>
</div>
=======
<center><img src="https://raw.githubusercontent.com/sidetrekAI/sidetrek-cli/master/.github/logo-tagline-light-svg.svg" width="100%"/></center>


### What is Sidetrek?

Sidetrek is the fastest way to build a modern data stack. It's an open-source CLI that helps you create a data project from scratch.

Sidetrek is built on top of popular open-source tools like Dagster, Meltano, DBT, Minio, Apache Iceberg, Trino, and Superset. We're continuously adding new tools - if you'd like to see a specific tool added, please let us know by opening an issue on our GitHub repository.

Our roadmap includes not just data engineering tools, but also machine learning and data science tools for ML and AI use cases.

### Why Sidetrek?

Data engineering is complex! There are so many tools out there and the list just keeps growing.

It's not only hard to keep up with the latest tools and best practices, but connecting these tools can be tricky. As a data engineer, you have so many responsibilities already. You shouldn't have to spend time figuring out how to set up and connect these tools together.

Sidetrek simplifies the process of creating a data project by providing a curated list of tools that work well together.

### Prerequisites

Make sure you have the following installed on your machine:

- Python version 3.10-3.11
- Poetry
- git CLI

## Quick Start

### Download and Install

Download the latest release for your OS. After you install it, verify installation by checking the version

```bash
sidetrek --version
```

### Initialize A Project

Initialize a new project by simply running this command:

```bash
sidetrek init
```

It will ask you to select the Python version- v3.10 and v3.11, enter the project name, and select the data stack. Currently, we only have one data stack available.

After pressing Enter, Sidetrek will start scaffolding your project and you'll see this message `You're all set - enjoy building your new data project! 🚀`

You can load our demo project if you want to take inspiration.

### Start The Project

Change working directory to your project directory by running `cd <project-name>`

Once you are in the project folder, run the following command:

```bash
sidetrek start
```

It will take a while to pull images when you run it for the first time.

## Data Stack

Your data project will include the following open-source tools:

- **Dagster** for orchestration
- **Meltano** for data ingestion
- **DBT** for data transformation
- **Minio** and Apache Iceberg for data storage
- **Trino** for querying your data
- **Superset** for data visualization

## Connect with Us

- 🌟 [Star us on GitHub](https://github.com/SidetrekAI/sidetrek-cli)
- 📚 [Read our documentation](https://docs.sidetrek.com/)
- 🔭 [Follow us on LinkedIn](https://www.linkedin.com/company/35626712)
- 👋 [Join us on Slack](https://join.slack.com/t/sidetrek-community/shared_invite/zt-2jt7qd46b-FmqAl3WSU~2uWtAFTXjj7A)
- ✏️ [Start a GitHub Discussion](https://github.com/SidetrekAI/sidetrek-cli/discussions)
- ✉️ [Contact us on our website](https://sidetrek-website.vercel.app/contact)

## How to Report An Issue

Contributions are welcome!

We're also building a team here at Sidetrek and are always on the lookout for great contributors to join us.

To report an issue, please open a new issue in [Issues](https://github.com/SidetrekAI/sidetrek-cli/issues).

## License

Sidetrek CLI is [Apache 2.0](https://github.com/SidetrekAI/sidetrek-cli/blob/main/LICENSE) licensed.
