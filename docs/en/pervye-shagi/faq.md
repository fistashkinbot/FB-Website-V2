# Bot FAQ

Below are frequently asked questions and their answers.

## 1. How do I view information about the bot?

To view information about the bot, you can use the following commands — `/botinfo` and `/stat`.  
These commands typically provide details such as the bot's ID, uptime, server count, and other data.

You can also refer to the documentation or contact the bot developer for additional information.

---

## 2. Why can't I see commands via /?

There are several reasons why `/` commands may not be visible:

- **Permissions**: The bot requires the following permissions: `applications.commands` and the relevant scopes.
- **Command registration delay**: It may take a few minutes for commands to appear.

---

## 3. How do I report bugs and issues?

To report bugs and issues:

- Join our [Discord server](https://discord.gg/H9XCZSReMj), find the **Support** channel, and create a post with the bug you've found.

This helps the bot receive patches with bug fixes and other improvements.

---

## 4. Forbidden error — what should I do?

The `Forbidden` error (HTTP 403) occurs when the bot lacks the necessary permissions to perform an action. Make sure the bot has the following permissions:

- Manage Messages
- Send Messages
- Read Message History
- Manage Roles (if applicable)

⚠️ Check the bot's roles and permissions on the server and grant all required permissions, especially if the `Administrator` permission was unchecked when the bot was added.

---

## 5. NotFound error — what should I do?

The `NotFound` error (HTTP 404) occurs when the bot cannot find a specific resource. Possible causes and solutions:

- **Invalid ID**: Make sure you are using the correct channel, message, user ID, etc.
- **Deleted resource**: Check whether the resource in question (e.g. a message or channel) has been deleted.
- **Insufficient permissions**: Make sure the bot has access to the relevant channels or server.

---

## 6. 'Unknown Integration' error — what is it?

The `Unknown Integration` error indicates that the bot is trying to interact with an integration that does not exist or has been deleted.

**Possible causes:**
- **Deleted integration**: The integration the bot is trying to interact with may have been deleted or modified.

If the issue persists after checking all of the above, it is recommended to contact the bot developer or integration service for further assistance.
