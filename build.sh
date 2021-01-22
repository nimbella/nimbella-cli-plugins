#!/bin/bash
# pbvd - plugin, build, version, and deploy
HELP_STR="usage: $0 -p [-b] [-v] [-d] [-h] [--plugin=<value>] [--build] [--version[=]<value>] [--deploy] [--help] \ne.g. \n./build.sh -p postman -b -v patch -d\n"


# Sanity check for build param
if [ -z "${1}" ]; then
  echo "Please specify the plugin to build!"
  echo -en "${HELP_STR}"
  exit 3
fi

optspec=":pbvdh-:"
while getopts "$optspec" optchar; do
    case "${optchar}" in
        -)
            case "${OPTARG}" in
                plugin)
                    val="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
                    PLUGIN="${val}"
                    cd ${PLUGIN} || exit
                    ;;
                build)
                    rm -rf node_modules
                    npm i
                    npm run build
                    echo built
                    ;;
                version)
                    val="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
                    TAG="${val}"                    
                    npm --no-git-tag-version version ${TAG}
                    echo versioned ${TAG} ${PLUGIN}
                    ;;
                deploy)
                    git tag -a ${PLUGIN}-${TAG} -m "${PLUGIN} ${TAG}"
                    git config push.default current && git push && git push --tags
                    npm publish --access=public
                    echo published
                    ;;                    
                help)
                    val="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
                    ;;
                *)
                    if [ "$OPTERR" = 1 ] && [ "${optspec:0:1}" != ":" ]; then
                        echo "Found an unknown option --${OPTARG}" >&2
                    fi
                    ;;
            esac;;
        p)
                val="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
                PLUGIN="${val}"
                cd ${PLUGIN} || exit
                ;;
        b)
                rm -rf node_modules
                npm i
                npm run build
                echo built
                ;;
        v)
                val="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
                TAG="${val}"                    
                VERSION=$(npm --no-git-tag-version version ${TAG})
                echo "versioned ${TAG} ${VERSION} for ${PLUGIN}"
                ;;
        d)
                git tag -a "${PLUGIN}-${VERSION}" -m "${PLUGIN} ${TAG} ${VERSION}"
                git config push.default current && git push --tags
                npm publish --access=public
                echo published
                ;;                                  
        h)
                echo "${HELP_STR}" >&2
                exit 2
                ;;
        *)
            if [ "$OPTERR" != 1 ] || [ "${optspec:0:1}" = ":" ]; then
                echo "Error parsing short flag: '-${OPTARG}'" >&2
                exit 1
            fi

            ;;
    esac
done

# Do we have even one argument?
if [ -z "$1" ]; then
  echo "${HELP_STR}" >&2
  exit 2
fi

echo "Done!"
exit 0
