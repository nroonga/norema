# norema - Node Reference Manual Search

[norema][] is a web service to search [node.js][] documentation.

[norema][] can be deployed onto PaaS services, such as heroku.

[norema][] uses [Groonga CloudSearch][], which is an [Amazon CloudSearch][] compatible implementation, as its search backend.

  [node.js]: http://nodejs.org/
  [Groonga CloudSearch]: http://gcs.github.com/
  [Amazon CloudSearch]: http://aws.amazon.com/en/cloudsearch/
  [norema]: https://github.com/nroonga/norema


## Setup

TODO: write more

    gcs-create-domain --domain-name norema
    gcs-configure-fields --domain-name norema --name title --type text --option result
    gcs-configure-fields --domain-name norema --name desc --type text --option result
    gcs-configure-fields --domain-name norema --name text --type text --option result
    gcs-configure-fields --domain-name norema --name path --type literal --option result
    gcs-configure-fields --domain-name norema --name path_facet --type literal --option facet
    gcs-configure-fields --domain-name norema --name type --type literal --option result
    gcs-configure-fields --domain-name norema --name index --type uint
    gcs-post-sdf --domain-name norema --source tools/all.sdf.json
