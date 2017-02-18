# git-lab

> tool for gitlab bulk operations on every project within a group

## install

```sh
npm install --save git-lab
````

## use

```sh
➜ git-lab -h

gitlab tool

usage: git-lab {options} -- {git command} [git options]

options:
 --token, -t gitlab acces token
 --url,   -u gitlab url, e.g: https://gitlab.myserver.com
 --group, -g gitlab group name

example:

 git-lab --token 009afdg0SdfAS14250 --url https://gitlab.myserver.com --group rocket-science  --save -- clone

example with environment variables:

 TOKEN=009afdg0SdfAS14250 URL=https://gitlab.myserver.com GROUP=rocket-science git-lab -- clone
```

## license

MIT