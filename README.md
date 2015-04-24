# ratom

rmate for GitHub's Atom text editor.

# Installation
Remote server:
```bash
curl -o /usr/local/bin/ratom https://raw.githubusercontent.com/aurora/rmate/master/rmate
sudo chmod +x /usr/local/bin/ratom
```
Edit `~/.ssh/config`:
```
Host example.com
    RemoteForward 52698 localhost:52698
    User user
```

# Usage

Go to `Packages -> ratom -> Start`
then:
```bash
ssh example.com
```
then on whatever file you want:
```
ratom file.txt
```
