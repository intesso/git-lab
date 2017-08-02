# git-lab

> tool for gitlab bulk operations on every project within a group

## examples


#### create project board

```sh
# single board
curl -H "PRIVATE-TOKEN: hDjozzh6dXKmovgdB8kQ" https://gitlab.mo-siemens.com/mygroup/myproject/boards

# create boards for every project in group
for i in $(node index groups projects justgo-node); do curl -H "PRIVATE-TOKEN: hDjozzh6dXKmovgdB8kQ" https://gitlab.mo-siemens.com/$i/boards; done
```

#### get boards

node index boards

## install

```sh
npm install -g git-lab
```

## use

```sh
gl projects | grep mygroup | gl projects get issues_enabled | gl check false | gl projects set issues_enabled true
```

gl projects
-> <group>/<project>

gl projects get issues_enabled
-> <group>/<project> true


```sh
# cd into your desired directory for the gitlab group
mkdir rocket-science && cd rocket-science

# enter token, url and group and save it
git-lab --token 009afdg0SdfAS14250 --url https://gitlab.myserver.com --group rocket-science  --save

# list all repos within the group
git-lab

# clone all repos within the group
git-lab -- clone

# execute actions on all repos (locally)
git-lab -- npm install
git-lab -- mvn install
```


you can also use the help:

```sh
➜ git-lab -h

gitlab tool

usage: git-lab {options} -- {git command} [git options]

options:
 --token, -t gitlab acces token
 --url,   -u gitlab url, e.g: https://gitlab.myserver.com

example:

 git-lab --token 009afdg0SdfAS14250 --url https://gitlab.myserver.com --group rocket-science  --save -- clone

example with environment variables:

 TOKEN=009afdg0SdfAS14250 URL=https://gitlab.myserver.com GROUP=rocket-science git-lab -s -- clone
```

## license

MIT