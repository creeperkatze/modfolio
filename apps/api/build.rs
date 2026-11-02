fn main() {
    let path = "../../package.json";
    println!("cargo:rerun-if-changed={path}");

    let manifest = std::fs::read_to_string(path).expect("root package.json should be readable");
    let version = manifest
        .lines()
        .find_map(|line| {
            let rest = line.trim().strip_prefix("\"version\"")?;
            let value = rest.trim_start().strip_prefix(':')?.trim();
            Some(value.trim_end_matches(',').trim_matches('"').to_string())
        })
        .expect("root package.json should have a version field");

    println!("cargo:rustc-env=MODFOLIO_VERSION={version}");
}
