
import * as wmillclient from "npm:windmill-client@1"
import wmill from "https://deno.land/x/wmill@v1.218.0/main.ts";
import { basename } from "https://deno.land/std@0.208.0/path/mod.ts";

export async function main(
  repo_url_resource_path: string,
  path: string,
  commit_msg: string,
) {
  let cwd = Deno.cwd();
  console.log(`Syncing script/flow/app ${path}`)

  let repo_name = await git_clone(repo_url_resource_path)

  Deno.chdir(`${cwd}/${repo_name}`);
  console.log(`Pushing to repository ${repo_name}`)

  await wmill_sync_pull(path)

  await git_push(path, commit_msg)

  console.log("Finished syncing")
  Deno.chdir(`${cwd}`)
}

async function git_clone(repo_resource_path: string): string {
  // TODO: handle private SSH keys as well
  let repo_url = (await wmillclient.getResource(repo_resource_path)).url
  let repo_name = basename(repo_url, ".git")

  await sh_run(
    "git",
    "clone",
    "--quiet",
    "--depth",
    "1",
    // we could use --sparse here
    // Will use the default branch - we could askl the user to use a custom branch instead
    repo_url,
    repo_name
  )
  return repo_name
}

async function git_push(path: string, commit_msg: string) {
  await sh_run(
    "git",
    "config",
    "user.email",
    Deno.env.get('WM_EMAIL')
  )
  await sh_run(
    "git",
    "config",
    "user.name",
    Deno.env.get('WM_USERNAME')
  )
  await sh_run(
    "git",
    "add",
    `${path}*`
  )
  try {
    await sh_run(
      "git",
      "diff",
      "--cached",
      "--quiet"
    )
  } catch {
    // git diff returns exit-code = 1 when there's at least on staged changes
    await sh_run(
      "git",
      "commit",
      "-m",
      commit_msg
    )
    await sh_run(
      "git",
      "push"
    )
    return
  }
  console.log("No changes detected, nothing to commit. Returning...")
}

async function sh_run(...cmd: string[]) {
  // console.log(`Running '${cmd.join(" ")}'`)
  let proc = Deno.run({ 
    cmd: cmd,
  })
  let status = await proc.status()
  if (!status.success) {
    throw `SH command '${cmd.join(" ")}' returned with a non-zero status ${status.code}`
  }
}

async function wmill_sync_pull(path: string) {
  await Deno.writeTextFile(".wmillignore", `*\n!${path}`);
  await wmill_run(
    "version"
  );
  console.log("Adding Windmill workspace")
  await wmill_run(
    "workspace",
    "add",
    Deno.env.get('WM_WORKSPACE'),
    Deno.env.get('WM_WORKSPACE'),
    Deno.env.get("BASE_INTERNAL_URL") + "/",
    "--token",
    Deno.env.get("WM_TOKEN") ?? '',
  );
  console.log("Pulling workspace into git repo")
  await wmill_run(
    "sync",
    "pull",
    "--token",
    Deno.env.get("WM_TOKEN") ?? '',
    "--workspace",
    Deno.env.get('WM_WORKSPACE'),
    "--yes",
    "--raw",
    "--skip-variables",
    "--skip-secrets",
    "--skip-resources",
  )
  await Deno.remove(".wmillignore");
}

async function wmill_run(...cmd: string[]) {
  await wmill.parse(cmd);
}
