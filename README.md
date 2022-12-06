# "Show current line in gitk" README

## Features

Provides two commands:

- `showCurrentLineInGitk`, which opens gitk with the commit that last changed
  the current line of the current editor window, with that line selected in
  gitk. From there, you can further drill down into history using gitk's "Show
  origin of this line" context menu.

- `showLogForCurrentLineRangeInGitk`, which opens gitk showing a log of the line
  range that is selected in the current editor window. This is useful for
  showing just the changes to a block of code.

## Requirements

This requires a patched version of gitk. Ableton's custom Mac installer for git includes that patch.

## Release Notes

### Unreleased

Add a second command `showLogForCurrentLineRangeInGitk`.

### 0.0.1

Initial release
