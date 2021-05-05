# AboveVTT

AboveVTT is a project that integrates a VTT inside your DnDBeyond campaign.

# Disclaimer

I (Daniele "cyruzzo" Martini) started AboveVTT as a hobby project. The initial target was just to have a shared maps and tokens,
but then things got out of hand. As this was just a way to "hack" inside DnDBeyond, I took every possible bad shortcut and ignored any best practice.
The goal was (and still is) to reach features quickly.

# Contributing

In this phase, we want to push out an offical release about every week. This will eventually slow down when we have enough features.

The process will go around two main days.

- *Wednesday*: Feature Freeze. What's in is in.. what's not will move to the next release. I'll branch main into a "version branch" (ex 0.0.41)
pack it as beta and send it on discord for beta testers. In the next days, if you want to provide a bugfix for this "prerelease", do it
without adding other features in the same branch.
- *Monday*: Push current "prerelease" (with any bugfixes) to the Chrome and Firefox stores

Of course, this is not a job, so the days may differ a bit.. anyway try to stick with those dealines.

Other considerations:
- Right now AboveVTT have people running games with it, so the most important rule for any PR is *we try our best to don't break things*
- Every PR *MUST* support basic compatibility with the previous versions of AboveVTT.
- Don't reformat the pieces you are not editing. It makes the PR hard to read, and you risk causing conflicts with other people work.
- Join the discord server and *talk with me* about what you are working on
- When you send me a pull request from one of your branches, don't add more features to that until I merge it (only bugfixes) 
- Try to keep different features in separate branches, so I can import them individually
- Be nice to other devs 

# License

Copyright (c) 2021 Daniele Martini

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <[https://www.gnu.org/licenses/](https://www.gnu.org/licenses/)>.
