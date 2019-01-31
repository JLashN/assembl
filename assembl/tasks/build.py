import os
import sys
import re
import json
from hashlib import sha256
from os.path import join, normpath

from .common import (venv, task, exists, is_integration_env, fill_template)


def get_node_base_path(c):
    return normpath(join(
        c.projectpath, 'assembl', 'static', 'js'))


def get_new_node_base_path(c):
    return normpath(join(
        c.projectpath, 'assembl', 'static2'))


def get_node_modules_path(c):
    return normpath(join(
        get_node_base_path(c), 'node_modules'))


def get_new_node_modules_path():
    return normpath(join(
        get_new_node_base_path(), 'node_modules'))

@task()
def update_bower(c):
    with c.cd(get_node_base_path(c)):
        with venv(c):
            c.run('npm update bower po2json')


def get_node_bin_path(c):
    return normpath(join(
        get_node_modules_path(c), '.bin'))


def bower_cmd(c, cmd, relative_path='.'):
    with c.cd(c.projectpath):
        bower_cmd = normpath(join(get_node_bin_path(c), 'bower'))
        po2json_cmd = normpath(join(get_node_bin_path(c), 'po2json'))
        if not exists(c, bower_cmd) or not exists(c, po2json_cmd):
            print 'Bower not present, installing ...'
            install_bower()
        with c.cd(relative_path):
            with venv(c):
                c.run(' '.join(("node", bower_cmd, '--allow-root', cmd)))


def _bower_foreach_do(c, cmd):
    bower_cmd(c, cmd)
    bower_cmd(c, cmd, 'assembl/static/widget/card')
    bower_cmd(c, cmd, 'assembl/static/widget/session')
    bower_cmd(c, cmd, 'assembl/static/widget/video')
    bower_cmd(c, cmd, 'assembl/static/widget/vote')
    bower_cmd(c, cmd, 'assembl/static/widget/creativity')
    bower_cmd(c, cmd, 'assembl/static/widget/share')


def separate_pip_install(context, package, wrapper=None):
    cmd = '%s/bin/pip install' % context.config.projectpath+"/venv"
    if wrapper:
        cmd = wrapper % (cmd,)
    context_dict = dict(context)
    cmd = cmd % context_dict
    cmd = "egrep '^%(package)s' %(projectpath)s/requirements-prod.frozen.txt | sed -e 's/#.*//' | xargs %(cmd)s" % dict(cmd=cmd, package=package, **context_dict)
    context.run(cmd)


def upgrade_yarn(context):
    if context.config._internal.mac:
        context.run('brew update && brew upgrade yarn')
    else:
        context.sudo('apt-get update && apt-get install --only-upgrade yarn')


@task()
def update_bower_requirements(c, force_reinstall=False):
    """ Normally not called manually """
    _bower_foreach_do(c, 'prune')
    if force_reinstall:
        _bower_foreach_do(c, 'install --force')
    else:
        _bower_foreach_do(c, 'update')


@task()
def update_node(c, force_reinstall=False):
    """
    Install node and nom to a know-good version.
    """
    node_version_cmd_regex = re.compile(r'^v10\.13\.0')
    with venv(c):
        node_version_cmd_result = c.run('node --version', echo=True).stdout
    match = node_version_cmd_regex.match(str(node_version_cmd_result))
    if not match or force_reinstall:
        # Stop gulp and webpack because otherwise node may be busy
        # TODO: Implement supervisor_process_stop
        # supervisor_process_stop('dev:gulp')
        # supervisor_process_stop('dev:webpack')
        with venv(c):
            c.run("rm -rf venv/lib/node_modules/")
            c.run("rm -f venv/bin/npm") # remove the symlink first otherwise next command raises OSError: [Errno 17] File exists
            c.run("nodeenv --node=10.13.0 --npm=6.4.1 --python-virtualenv assembl/static/js")
        upgrade_yarn(c)
        with c.cd(get_node_base_path(c)):
            with venv(c):
                c.run("npm install reinstall -g")

        update_npm_requirement(force_reinstall=True)
    else:
        print "Node version OK"


@task()
def update_npm_requirements(c, force_reinstall=False):
    """Normally not called manually"""
    with c.cd(get_node_base_path(c)):
        if force_reinstall:
            with venv(c):
                c.run('reinstall')
        else:
            with venv(c):
                c.run('npm update')

    if c.config._internal.mac:
        yarn_path = '/usr/local/bin/yarn'
    else:
        yarn_path = '/usr/bin/yarn'
    static2_path = get_new_node_base_path(c)
    with c.cd(static2_path):
        if exists(c, yarn_path):
            if force_reinstall:
                print('Removing node_modules directory...')
                with venv(c):
                    c.run('rm -rf {}'.format(os.path.join(static2_path, 'node_modules')))
            with venv(c):
                c.run(yarn_path)
        else:
            if force_reinstall:
                with venv(c):
                    c.run('reinstall')
            else:
                with venv(c):
                    c.run('npm update')


@task()
def clone_repository(c, reset=False):
    """
    Clone repository
    """
    print('Cloning Git repository')

    # Remove dir if necessary
    path = c.config.projectpath
    if exists(c, os.path.join(path, ".git")):
        print "%s/.git already exists" % path
        if reset:
            c.run("rm -rf %s/.git" % path)
        else:
            return

    # Clone
    branch = c.config.get('gitbranch', 'master')
    repo = c.config.get('gitrepo', 'https://github.com/assembl/assembl.git')
    with c.cd(path):
        c.run("git clone --branch {0} {1} {2}".format(
            branch, repo, os.path.join(path, 'assembl')))


@task()
def updatemaincode(c):
    """
    Update code and/or switch branch
    """
    print('Updating Git repository')
    with c.cd(c.config.projectpath):
        c.run('git fetch')
        c.run('git checkout %s' % c.config._internal.gitbranch)
        c.run('git pull %s %s' % (c.config._internal.gitrepo, c.config._internal.gitbranch))


@task()
def update_pip_requirements(c, force_reinstall=False):
    """
    Update external dependencies on remote host.
    """
    with venv(c):
        c.run('pip install -U setuptools "pip<10" ')

    if force_reinstall:
        c.run("%s/bin/pip install --ignore-installed -r %s/requirements.txt" % (c.config.venvpath, c.config.projectpath))
    else:
        specials = [
            # setuptools and lxml need to be installed before compiling dm.xmlsec.binding
            ("lxml", None, None),
            # Thanks to https://github.com/pypa/pip/issues/4453 disable wheel separately.
            ("dm.xmlsec.binding", "%s --install-option='-q'", "%s --install-option='-q'"),
            ("pycurl", None, 'env PYCURL_SSL_LIBRARY=openssl MACOSX_DEPLOYMENT_TARGET="10.13" LDFLAGS="-L/usr/local/opt/openssl/lib" CPPFLAGS="-I/usr/local/opt/openssl/include" %s'),
        ]
        for package, wrapper, mac_wrapper in specials:
            wrapper = mac_wrapper if c.config._internal.mac else wrapper
            separate_pip_install(c, package, wrapper)
        cmd = "%s/bin/pip install -r %s/requirements.txt" % (c.config.venvpath, c.config.projectpath)
        c.run("yes w | %s" % cmd)


@task()
def app_update_dependencies(c, force_reinstall=False):
    """
    Updates all python and javascript dependencies.  Everything that requires a
    network connection to update.
    """
    update_pip_requirements(c, force_reinstall=force_reinstall)
    update_node(c, force_reinstall=force_reinstall)
    update_bower(c)
    update_bower_requirements(c, force_reinstall=force_reinstall)
    update_npm_requirements(c, force_reinstall=force_reinstall)


@task()
def create_wheelhouse(c, dependency_links=None):
    if not dependency_links:
        dependency_links = c.run('grep "git+http" %(here)s/requirements-dev.frozen.txt > %(here)s/deps.txt' % {
                                 'here': c.config.code_root}).stdout
    tmp_wheel_path = os.path.join(c.config.code_root, 'wheelhouse')
    cmd = 'pip wheel --wheel-dir=%s --process-dependency-links -r %s' % (tmp_wheel_path, dependency_links)
    if is_integration_env(c):
        c.run(cmd)
    else:
        with venv(c):
            c.run(cmd)


def create_wheel_name(version, sha1, branch=None, tag=None):
    """
    Follows the recommended naming scheme of PEP 491 (https://www.python.org/dev/peps/pep-0491/#file-name-convention)
    """
    python_version = "py%d%d" % (sys.version_info.major, sys.version_info.minor)
    if version == tag:
        # CI condition of a tag (which should only ever be put on master)
        long_version = version
    elif branch:
        long_version = '%sd-1%s' % (version, branch)
    elif tag:
        long_version = '%sd-2%s' % (version, tag.split('-').join(''))
    else:
        long_version = '%sd-0%s' % (version, sha1)

    return "assembl-{version}-{python_version}-none-any.whl".format(
        version=long_version,
        python_version=python_version)


def update_wheels_json_data(c, json_data):
    if is_integration_env(c):
        # Assumption is Gitlab CI
        commit_hash = sys.getenv('CI_COMMIT_SHORT_SHA', None)
        tag = sys.getenv('CI_COMMIT_TAG', None)
        branch = sys.getenv('CI_COMMIT_REF_NAME', None)
    else:
        # Take the latest HEAD
        commit_hash = c.run('git rev-parse --short HEAD').stdout.strip()
        branch = c.run('git symbolic-ref --short HEAD').stdout.strip()
        tag = c.run('git describe').stdout.strip()
        annotated_tag = c.run('git describe --tags HEAD').stdout.strip()
        if re.match(r"[\d\.]", tag):
            pass
        elif re.match(r"[\d\.]+-\d+-.+", tag):
            # The commit does not have a tag associated
            tag = None
        else:
            tag = None
    # Debugging purposes for Gitlab
    with open(os.path.join(c.config.code_root, 'VERSION')) as f:
        version = f.read().strip()
    print "CI_COMMIT_REF_NAME: %s" % branch
    print "CI_COMMIT_TAG: %s" % tag
    print "CI_COMMIT_REF_NAME: %s" % commit_hash
    if tag and tag not in json_data:
        json_data[tag] = {
            'sha1': commit_hash,
            'link_name': create_wheel_name(version, commit_hash, tag=tag),
            'wheel_name': create_wheel_name(version, commit_hash)
        }
    # update the links for the branches
    json_data[branch] = {
        'sha1': commit_hash,
        'link_name': create_wheel_name(version, commit_hash, branch=branch),
        'wheel_name': create_wheel_name(version, commit_hash)
    }
    return json_data


def write_update_json_data(c, json_filepath):
    if exists(c, json_filepath):
        with open(json_filepath) as fp:
            json_data = json.load(fp)
    else:
        json_data = {}
    json_data = update_wheels_json_data(c, json_data)
    with open(json_filepath, 'w+') as fp:
        json.dump(json_data, fp)
    return json_data


@task()
def push_wheelhouse(c, house=None):
    """
    Push dependency links wheelhouse to either:
    A) an S3 bucket
    B) a remote folder via SSH
    C) a local folder
    """
    tmp_wheel_path = house if house else os.path.join(c.config.code_root, 'wheelhouse')
    wheel_path = c.config.wheelhouse
    json_filename = 'special-wheels.json'
    if not wheel_path:
        raise RuntimeError("No wheelhouse location was defined in configuration. Cannot continue...")
    elif not tmp_wheel_path:
        raise RuntimeError("There is no local wheelhouse to push. Quitting...")

    if wheel_path.strip().startswith('s3://'):
        # S3
        try:
            import botocore
            import boto3
        except ImportError:
            raise RuntimeError("AWS CLI and Boto3 have to be installed to push to s3. Quitting...")

        s3 = boto3.resource('s3')
        bucket_name = wheel_path[5:]
        bucket = s3.Bucket(bucket_name)
        exists = True
        try:
            s3.meta.client.head_bucket(Bucket=bucket_name)
        except botocore.exceptions.ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                exists = False
        if not exists:
            raise RuntimeError("The Bluenove wheelhouse bucket does not exist on S3. Please create it before continuing...")

        # There must exist a JSON file which holds links to the latest wheels on various branches, along with version tags
        json_filepath = os.path.join(tmp_wheel_path, json_filename)
        try:
            bucket.download_file(json_filename, json_filepath)
        except:
            pass

        indexable_names = list()
        wheel_hashes = {}
        existing_wheels = set()
        for filename in os.listdir(tmp_wheel_path):
            indexable_names.append(filename)
            with open(os.path.join(tmp_wheel_path, filename), 'rb') as f:
                m = sha256()
                m.update(f.read())
            wheel_hashes[filename] = m.hexdigest()
        for summary in bucket.objects.all():
            if summary.key in (json_filename, 'error.html'):
                # Don't add the JSON file to the indexable list
                continue
            existing_wheels.add(summary.key)
            if summary.key not in wheel_hashes:
                indexable_names.append(summary.key)
                wheel_hashes[summary.key] = ''  # temporary for testing

        indexable_names.sort()

        json_data = write_update_json_data(c, json_filepath)

        output = os.path.join(tmp_wheel_path, 'index.html')
        fill_template(c, 'wheelhouse_index.jinja2', output, {'wheelhouse': indexable_names, 'hashes': wheel_hashes})
        with open(output) as fp:
            bucket.put_object(Body=fp, Key='index.html', ContentType='text/html', ACL='public-read')

        with open(json_filepath) as fp:
            bucket.put_object(Body=fp, Key=json_filename, ContentType='application/json', ACL='public-read')

        for file in os.listdir(tmp_wheel_path):
            if file not in existing_wheels:
                with open(os.path.join(tmp_wheel_path, file)) as fp:
                    bucket.put_object(Body=fp, Key=file, ACL='public-read')

        # put empty objects for S3-redirections (https://docs.aws.amazon.com/AmazonS3/latest/dev/how-to-page-redirect.html)
        for value in json_data.itervalues():
            bucket.put_object(Key=value['link_name'], ACL='public-read', Body='',
                              WebsiteRedirectLocation='/%s' % value['wheel_name'])

    elif wheel_path.strip().startswith('local://'):
        c.run('cp -r %s %s' % (tmp_wheel_path, wheel_path.split('local://')[1]))
    else:
        c.run('cp -r %s %s' % (tmp_wheel_path, wheel_path))