#!/bin/bash
# bptd - build, pack, tag, and deploy 
HELP_STR="usage: $0 -b [-p] [-t] [-d] [-h] [--build=<value>] [--pack] [--tag[=]<value>] [--deploy] [--help] \ne.g. \n./build.sh -b postman -p -t latest -d\n"


# Sanity check for build param
if [ -z ${1} ]; then
  echo "Please specify the plugin to build!"
  echo -en "${HELP_STR}"
  exit 3
fi

optspec=":bptdh-:"
while getopts "$optspec" optchar; do
    case "${optchar}" in
        -)
            case "${OPTARG}" in
                build)
                    val="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                    BUILD="${val}"
                    cd ${BUILD}
                    rm -rf node_modules
                    npm i
                    npm run build
                    echo built
                    ;;
                pack)
                    rm -f ${BUILD}-*.tgz
                    npm pack
                    echo packed
                    ;;                    
                tag)
                    val="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                    TAG="${val}"                    
                    mv ${BUILD}-*.tgz ${BUILD}-${TAG}.tgz
                    echo tagged
                    ;;
                deploy)
                    gsutil rm  gs://nimaio-apigcp-nimbella-io/${BUILD}-*.tgz
                    gsutil cp ${BUILD}-*.tgz gs://nimaio-apigcp-nimbella-io/
                    gsutil setmeta -h "Cache-Control:no-cache" gs://nimaio-apigcp-nimbella-io/${BUILD}-*.tgz
                    echo deployed
                    ;;                       
                help)
                    val="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                    ;;
                *)
                    if [ "$OPTERR" = 1 ] && [ "${optspec:0:1}" != ":" ]; then
                        echo "Found an unknown option --${OPTARG}" >&2
                    fi
                    ;;
            esac;;
        b)
                val="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                BUILD="${val}"
                cd ${BUILD}
                rm -rf node_modules
                npm i
                npm run build
                echo built
                ;;
        p)
                rm -f ${BUILD}-*.tgz
                npm pack
                echo packed
                ;;                
        t)
                val="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                TAG="${val}"                
                mv ${BUILD}-*.tgz ${BUILD}-${TAG}.tgz
                echo tagged
                ;;
        d)
                gsutil rm  gs://nimaio-apigcp-nimbella-io/${BUILD}-*.tgz
                gsutil cp ${BUILD}-*.tgz gs://nimaio-apigcp-nimbella-io/
                gsutil setmeta -h "Cache-Control:no-cache" gs://nimaio-apigcp-nimbella-io/${BUILD}-*.tgz
                echo deployed
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

echo "Done with building ${BUILD}!"
exit 0
