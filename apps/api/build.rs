fn main() {
    let path = "../../package.json";
    println!("cargo:rerun-if-changed={path}");

    let manifest = std::fs::read_to_string(path).expect("root package.json should be readable");
    let manifest: serde_json::Value = serde_json::from_str(&manifest).expect("root package.json should be valid JSON");
    let version = manifest["version"]
        .as_str()
        .expect("root package.json should have a version field");

    println!("cargo:rustc-env=MODFOLIO_VERSION={version}");
}
