export interface Repo {
  allow_forking: boolean;
  archive_url: string;
  archived: boolean;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  clone_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  created_at: Date;
  default_branch: string;
  deployments_url: string;
  description: null;
  disabled: boolean;
  downloads_url: string;
  events_url: string;
  fork: boolean;
  forks: number;
  forks_count: number;
  forks_url: string;
  full_name: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  has_discussions: boolean;
  has_downloads: boolean;
  has_issues: boolean;
  has_pages: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  homepage: null;
  hooks_url: string;
  html_url: string;
  id: number;
  is_template: boolean;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  language: string;
  languages_url: string;
  license: License;
  merges_url: string;
  milestones_url: string;
  mirror_url: null;
  name: string;
  node_id: string;
  notifications_url: string;
  open_issues: number;
  open_issues_count: number;
  owner: Owner;
  permissions: Permissions;
  private: boolean;
  pulls_url: string;
  pushed_at: Date;
  releases_url: string;
  size: number;
  ssh_url: string;
  stargazers_count: number;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  svn_url: string;
  tags_url: string;
  teams_url: string;
  topics: any[];
  trees_url: string;
  updated_at: Date;
  url: string;
  visibility: string;
  watchers: number;
  watchers_count: number;
  web_commit_signoff_required: boolean;
}

export interface License {
  key: string;
  name: string;
  node_id: string;
  spdx_id: string;
  url: string;
}

export interface Owner {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;
}

export interface Permissions {
  admin: boolean;
  maintain: boolean;
  pull: boolean;
  push: boolean;
  triage: boolean;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toTest(json: string): Test {
    return cast(JSON.parse(json), r("Test"));
  }

  public static testToJson(value: Test): string {
    return JSON.stringify(uncast(value, r("Test")), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ""): never {
  const prettyTyp = prettyTypeName(typ);
  const parentText = parent ? ` on ${parent}` : "";
  const keyText = key ? ` for key "${key}"` : "";
  throw Error(
    `Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(
      val,
    )}`,
  );
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`;
    } else {
      return `one of [${typ
        .map((a) => {
          return prettyTypeName(a);
        })
        .join(", ")}]`;
    }
  } else if (typeof typ === "object" && typ.literal !== undefined) {
    return typ.literal;
  } else {
    return typeof typ;
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }));
    typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }));
    typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(
  val: any,
  typ: any,
  getProps: any,
  key: any = "",
  parent: any = "",
): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val;
    return invalidValue(typ, val, key, parent);
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length;
    for (let i = 0; i < l; i++) {
      const typ = typs[i];
      try {
        return transform(val, typ, getProps);
      } catch (_) {}
    }
    return invalidValue(typs, val, key, parent);
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val;
    return invalidValue(
      cases.map((a) => {
        return l(a);
      }),
      val,
      key,
      parent,
    );
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
    return val.map((el) => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null;
    }
    const d = new Date(val);
    if (isNaN(d.valueOf())) {
      return invalidValue(l("Date"), val, key, parent);
    }
    return d;
  }

  function transformObject(
    props: { [k: string]: any },
    additional: any,
    val: any,
  ): any {
    if (val === null || typeof val !== "object" || Array.isArray(val)) {
      return invalidValue(l(ref || "object"), val, key, parent);
    }
    const result: any = {};
    Object.getOwnPropertyNames(props).forEach((key) => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key)
        ? val[key]
        : undefined;
      result[prop.key] = transform(v, prop.typ, getProps, key, ref);
    });
    Object.getOwnPropertyNames(val).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref);
      }
    });
    return result;
  }

  if (typ === "any") return val;
  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val, key, parent);
  }
  if (typ === false) return invalidValue(typ, val, key, parent);
  let ref: any = undefined;
  while (typeof typ === "object" && typ.ref !== undefined) {
    ref = typ.ref;
    typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === "object") {
    return typ.hasOwnProperty("unionMembers")
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty("arrayItems")
      ? transformArray(typ.arrayItems, val)
      : typ.hasOwnProperty("props")
      ? transformObject(getProps(typ), typ.additional, val)
      : invalidValue(typ, val, key, parent);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== "number") return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
  return { literal: typ };
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  Test: o(
    [
      { json: "allow_forking", js: "allow_forking", typ: true },
      { json: "archive_url", js: "archive_url", typ: "" },
      { json: "archived", js: "archived", typ: true },
      { json: "assignees_url", js: "assignees_url", typ: "" },
      { json: "blobs_url", js: "blobs_url", typ: "" },
      { json: "branches_url", js: "branches_url", typ: "" },
      { json: "clone_url", js: "clone_url", typ: "" },
      { json: "collaborators_url", js: "collaborators_url", typ: "" },
      { json: "comments_url", js: "comments_url", typ: "" },
      { json: "commits_url", js: "commits_url", typ: "" },
      { json: "compare_url", js: "compare_url", typ: "" },
      { json: "contents_url", js: "contents_url", typ: "" },
      { json: "contributors_url", js: "contributors_url", typ: "" },
      { json: "created_at", js: "created_at", typ: Date },
      { json: "default_branch", js: "default_branch", typ: "" },
      { json: "deployments_url", js: "deployments_url", typ: "" },
      { json: "description", js: "description", typ: null },
      { json: "disabled", js: "disabled", typ: true },
      { json: "downloads_url", js: "downloads_url", typ: "" },
      { json: "events_url", js: "events_url", typ: "" },
      { json: "fork", js: "fork", typ: true },
      { json: "forks", js: "forks", typ: 0 },
      { json: "forks_count", js: "forks_count", typ: 0 },
      { json: "forks_url", js: "forks_url", typ: "" },
      { json: "full_name", js: "full_name", typ: "" },
      { json: "git_commits_url", js: "git_commits_url", typ: "" },
      { json: "git_refs_url", js: "git_refs_url", typ: "" },
      { json: "git_tags_url", js: "git_tags_url", typ: "" },
      { json: "git_url", js: "git_url", typ: "" },
      { json: "has_discussions", js: "has_discussions", typ: true },
      { json: "has_downloads", js: "has_downloads", typ: true },
      { json: "has_issues", js: "has_issues", typ: true },
      { json: "has_pages", js: "has_pages", typ: true },
      { json: "has_projects", js: "has_projects", typ: true },
      { json: "has_wiki", js: "has_wiki", typ: true },
      { json: "homepage", js: "homepage", typ: null },
      { json: "hooks_url", js: "hooks_url", typ: "" },
      { json: "html_url", js: "html_url", typ: "" },
      { json: "id", js: "id", typ: 0 },
      { json: "is_template", js: "is_template", typ: true },
      { json: "issue_comment_url", js: "issue_comment_url", typ: "" },
      { json: "issue_events_url", js: "issue_events_url", typ: "" },
      { json: "issues_url", js: "issues_url", typ: "" },
      { json: "keys_url", js: "keys_url", typ: "" },
      { json: "labels_url", js: "labels_url", typ: "" },
      { json: "language", js: "language", typ: "" },
      { json: "languages_url", js: "languages_url", typ: "" },
      { json: "license", js: "license", typ: r("License") },
      { json: "merges_url", js: "merges_url", typ: "" },
      { json: "milestones_url", js: "milestones_url", typ: "" },
      { json: "mirror_url", js: "mirror_url", typ: null },
      { json: "name", js: "name", typ: "" },
      { json: "node_id", js: "node_id", typ: "" },
      { json: "notifications_url", js: "notifications_url", typ: "" },
      { json: "open_issues", js: "open_issues", typ: 0 },
      { json: "open_issues_count", js: "open_issues_count", typ: 0 },
      { json: "owner", js: "owner", typ: r("Owner") },
      { json: "permissions", js: "permissions", typ: r("Permissions") },
      { json: "private", js: "private", typ: true },
      { json: "pulls_url", js: "pulls_url", typ: "" },
      { json: "pushed_at", js: "pushed_at", typ: Date },
      { json: "releases_url", js: "releases_url", typ: "" },
      { json: "size", js: "size", typ: 0 },
      { json: "ssh_url", js: "ssh_url", typ: "" },
      { json: "stargazers_count", js: "stargazers_count", typ: 0 },
      { json: "stargazers_url", js: "stargazers_url", typ: "" },
      { json: "statuses_url", js: "statuses_url", typ: "" },
      { json: "subscribers_url", js: "subscribers_url", typ: "" },
      { json: "subscription_url", js: "subscription_url", typ: "" },
      { json: "svn_url", js: "svn_url", typ: "" },
      { json: "tags_url", js: "tags_url", typ: "" },
      { json: "teams_url", js: "teams_url", typ: "" },
      { json: "topics", js: "topics", typ: a("any") },
      { json: "trees_url", js: "trees_url", typ: "" },
      { json: "updated_at", js: "updated_at", typ: Date },
      { json: "url", js: "url", typ: "" },
      { json: "visibility", js: "visibility", typ: "" },
      { json: "watchers", js: "watchers", typ: 0 },
      { json: "watchers_count", js: "watchers_count", typ: 0 },
      {
        json: "web_commit_signoff_required",
        js: "web_commit_signoff_required",
        typ: true,
      },
    ],
    false,
  ),
  License: o(
    [
      { json: "key", js: "key", typ: "" },
      { json: "name", js: "name", typ: "" },
      { json: "node_id", js: "node_id", typ: "" },
      { json: "spdx_id", js: "spdx_id", typ: "" },
      { json: "url", js: "url", typ: "" },
    ],
    false,
  ),
  Owner: o(
    [
      { json: "avatar_url", js: "avatar_url", typ: "" },
      { json: "events_url", js: "events_url", typ: "" },
      { json: "followers_url", js: "followers_url", typ: "" },
      { json: "following_url", js: "following_url", typ: "" },
      { json: "gists_url", js: "gists_url", typ: "" },
      { json: "gravatar_id", js: "gravatar_id", typ: "" },
      { json: "html_url", js: "html_url", typ: "" },
      { json: "id", js: "id", typ: 0 },
      { json: "login", js: "login", typ: "" },
      { json: "node_id", js: "node_id", typ: "" },
      { json: "organizations_url", js: "organizations_url", typ: "" },
      { json: "received_events_url", js: "received_events_url", typ: "" },
      { json: "repos_url", js: "repos_url", typ: "" },
      { json: "site_admin", js: "site_admin", typ: true },
      { json: "starred_url", js: "starred_url", typ: "" },
      { json: "subscriptions_url", js: "subscriptions_url", typ: "" },
      { json: "type", js: "type", typ: "" },
      { json: "url", js: "url", typ: "" },
    ],
    false,
  ),
  Permissions: o(
    [
      { json: "admin", js: "admin", typ: true },
      { json: "maintain", js: "maintain", typ: true },
      { json: "pull", js: "pull", typ: true },
      { json: "push", js: "push", typ: true },
      { json: "triage", js: "triage", typ: true },
    ],
    false,
  ),
};
