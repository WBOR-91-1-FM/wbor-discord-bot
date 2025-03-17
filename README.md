# wbor-discord-bot: A Discord bot for WBOR

`wbor-discord-bot` is a simple bot that allows you to interact with [WBOR](https://wbor.org) directly in your guild. You can listen to the station on voice channels, show last played tracks, currently playing, and more.

This project is a fork of [Azuri](https://github.com/AzuraCast/Azuri). However, we've rewritten it using TypeScript and reorganized the codebase. Only some original code has been kept.

## TODO

- [x] listen to the station on voice channels;
- [x] show last played tracks, currently playing;
- [x] migrate to typescript;
- [x] update channel status on song changes (only updates when joining the vc);
- [x] update bot presence on song changes;
- [ ] dockerize it;
- [ ] show current show info when appropiate;
- [ ] stop scraping the spinitron page for show data.
