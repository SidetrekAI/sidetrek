<img src="https://raw.githubusercontent.com/sidetrekAI/sidetrek/master/.github/logo-tagline-light-svg.svg" width="100%"/>

<div align="center">
<img src="https://img.shields.io/github/license/SidetrekAI/sidetrek?color=%23866eea" style="max-width: 100%;" />
<img src="https://img.shields.io/github/last-commit/SidetrekAI/sidetrek?color=%23ff4d84&logo=github&logoColor=white" style="max-width: 100%;" />
<img src="https://img.shields.io/badge/python-v3.10%20%7C%20v3.11-black?logo=python&logoColor=yellow" style="max-width: 100%;" />
<a href="https://join.slack.com/t/sidetrek-community/shared_invite/zt-2jt7qd46b-FmqAl3WSU~2uWtAFTXjj7A"><img src="https://img.shields.io/badge/slack-white?logo=slack&logoColor=red" style="max-width: 100%;" /></a>
<a href="https://www.linkedin.com/company/35626712"><img src="https://img.shields.io/badge/linkedin-white?logo=linkedin&logoColor=blue" style="max-width: 100%;" /></a>
</div>

### What is Sidetrek?

Sidetrek is the fastest way to build a modern data stack. It's an open-source CLI that helps you create a data project from scratch.

Sidetrek is built on top of popular open-source tools like Dagster, Meltano, DBT, Minio, Apache Iceberg, Trino, and Superset. We're continuously adding new tools and use cases - if you'd like to see a specific tool added, please let us know by opening an issue on our GitHub repository.

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

### Supported Platforms

Currently we support MacOs and Linux, but NOT Windows.

## Quick Start

If you're new to Sidetrek, the best place to start is our [Get Started](https://docs.sidetrek.com/get-started/overview) guide.

### Download and Install

Download the latest release of Sidetrek CLI.

```bash
curl -fsSL https://sidetrek.com/cli.sh | sh
```

Once you install it, verify the installation by checking the version:

```bash
sidetrek --version
```

### Updating Sidetrek

To update Sidetrek to the latest version, you simply need to run the install command again:

```bash
curl -fsSL https://sidetrek.com/cli.sh | sh
```

### Initialize A Project

Initialize a new project by running this command:

```bash
sidetrek init
```

It will ask you to select the Python version, enter the project name, and select the data stack. Currently, we only have one data stack available made up of the following open-source tools:

- **Dagster** for orchestration
- **Meltano** for data ingestion
- **DBT** for data transformation
- **Minio** and Apache Iceberg for data storage
- **Trino** for querying your data
- **Superset** for data visualization

After pressing Enter, Sidetrek will start scaffolding your project and when it's done, you'll see the message `You're all set - enjoy building your new data project! 🚀`

### Start the Project

Change working directory to your project directory by running `cd <your_project>`

Once you are in the project folder, run the following command:

```bash
sidetrek start
```

If you're running it for the first time, it will take a while to pull all the images, so please be patient!

Once it's up and running, you can see the Dagster UI here: http://localhost:3000.

### Explore the Example Project

If you opted in to include an example project (recommended), you have a fully functional example data pipeline set up now. 

You still have to do a few things though if you want to see the example data visualized in Superset (http://localhost:8088).

1. Run the Meltano ingestion job in Dagster to load the example data into Iceberg tables.
2. Run the DBT transformations in Dagster.
3. Add Trino as a database connection in Superset.
4. Add an example dashboard in Superset.

Once you've completed the above steps, you should be able to see the Superset dashboard with charts!

For more information, please check out the [Explore Example Guide](https://docs.sidetrek.com/get-started/step-4-explore-example).

For a full guide from installation to example data visualization, check out our [Get Started](https://docs.sidetrek.com/get-started/overview) guide.

## Data Stack

Your data project will include the following open-source tools:

- **Dagster** for orchestration
- **Meltano** for data ingestion
- **DBT** for data transformation
- **Minio** and Apache Iceberg for data storage
- **Trino** for querying your data
- **Superset** for data visualization

We're working on adding more tools and use cases. If you have a suggestion, please feel free to reach out to us.

We'd love to learn more about what your use case!

## Connect with Us

- 🌟 [Star us on GitHub](https://github.com/SidetrekAI/sidetrek)
- 📚 [Read our documentation](https://docs.sidetrek.com/)
- 🔭 [Follow us on LinkedIn](https://www.linkedin.com/company/35626712)
- 👋 [Join us on Slack](https://join.slack.com/t/sidetrek-community/shared_invite/zt-2jt7qd46b-FmqAl3WSU~2uWtAFTXjj7A)
- ✏️ [Start a GitHub Discussion](https://github.com/SidetrekAI/sidetrek/discussions)
- ✉️ [Contact us via email](https://sidetrek.com/contact)

## Have questions? Talk to us!

If you have any questions, feel free to reach out to us on [Slack](https://join.slack.com/t/sidetrek-community/shared_invite/zt-2jt7qd46b-FmqAl3WSU~2uWtAFTXjj7A), [Github](https://github.com/SidetrekAI/sidetrek) or [email](https://sidetrek.com/contact). We're here to help!

We're continuously improving our documentation so if you have a use case that we don't cover, please let us know and we'll do our best to create a good tutorial for it.

We'd love to learn more about your use case and help you get it working. So don't hesitate to reach out!

## Project Maturity

Sidetrek is new and we will likely have breaking changes in the future.

If there are any breaking changes, we will make it clear in the release notes. 

Right now Sidetrek is mostly a set up tool, so any future changes should not impact your existing project scaffolded by Sidetrek. But as we add more advanced features, this may change. If there are any such changes, we will let you know in the release notes.

## Contributions

Contributions are always welcome!

We're also building a team here at Sidetrek and are always on the lookout for great contributors to join us.

## Report an Issue

To report an issue, please open a new issue in [Issues](https://github.com/SidetrekAI/sidetrek/issues).

## License

Sidetrek is [Apache 2.0](https://github.com/SidetrekAI/sidetrek/blob/main/LICENSE) licensed.
