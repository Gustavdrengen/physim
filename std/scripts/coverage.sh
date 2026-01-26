#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Checking test coverage..."

# --- File Structure Check ---
echo "Checking file structure..."
errors_found=false

# Check for missing test files
for src_file in $(find src/public -name "*.ts"); do
    # Get the path relative to src/public, without the .ts extension
    relative_path_no_ext=$(echo "$src_file" | sed 's/^src\/public\///' | sed 's/\.ts$//')

    # Option 1: Direct test file (e.g., tests/module.test.ts)
    direct_test_file="tests/${relative_path_no_ext}.test.ts"

    # Option 2: Test directory (e.g., tests/module/some.test.ts)
    test_directory="tests/${relative_path_no_ext}"

    # Check if either a direct test file exists OR the test directory exists and contains any .test.ts files
    if [ ! -f "$direct_test_file" ] && \
       ( [ ! -d "$test_directory" ] || [ -z "$(find "$test_directory" -name "*.test.ts" -print -quit)" ] ); then
        echo -e "${RED}Error: Missing test file(s) for $src_file. Expected $direct_test_file or test files in $test_directory/.${NC}"
        errors_found=true
    fi
done

# --- Check for extra test files ---
for test_file in $(find tests -name "*.test.ts"); do
    if [ "$test_file" == "tests/exampleTest.test.ts" ]; then
        continue
    fi

    # Get the path relative to tests/, without the .test.ts extension
    relative_test_path_no_ext=$(echo "$test_file" | sed 's/^tests\///' | sed 's/\.test\.ts$//')

    # Try to find a direct corresponding src/public file
    src_file_direct="src/public/${relative_test_path_no_ext}.ts"

    # Try to find a corresponding src/public directory (if the test file is in a subdirectory)
    # e.g., tests/draw/color.test.ts -> src/public/draw.ts
    src_file_from_subdir=""
    if [[ "$relative_test_path_no_ext" == */* ]]; then
        parent_dir=$(dirname "$relative_test_path_no_ext")
        src_file_from_subdir="src/public/${parent_dir}.ts"
    fi

    if [ ! -f "$src_file_direct" ] && [ ! -f "$src_file_from_subdir" ]; then
        echo -e "${RED}Error: Extra test file found: $test_file. No corresponding source file in src/public.${NC}"
        errors_found=true
    fi
done


if [ "$errors_found" = true ]; then
    echo -e "${RED}File structure check failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Test file structure is correct.${NC}"


# --- Export Coverage Check ---
echo "Checking export coverage..."
errors_found=false

for src_file in $(find src/public -name "*.ts"); do
    # Get the path relative to src/public, without the .ts extension
    relative_path_no_ext=$(echo "$src_file" | sed 's/^src\/public\///' | sed 's/\.ts$//')

    # Find all potential test files for this src_file
    test_files_for_src=()
    direct_test_file="tests/${relative_path_no_ext}.test.ts"
    test_directory="tests/${relative_path_no_ext}"

    if [ -f "$direct_test_file" ]; then
        test_files_for_src+=("$direct_test_file")
    fi
    if [ -d "$test_directory" ]; then
        while IFS= read -r -d '' file; do
            test_files_for_src+=("$file")
        done < <(find "$test_directory" -name "*.test.ts" -print0)
    fi

    if [ ${#test_files_for_src[@]} -eq 0 ]; then
        # This case is already handled by the "missing test files" check
        continue
    fi

    # Get exported function and class names
    exports=$(grep -E "^export (async function|function|class)" "$src_file" | sed -E 's/export (async function|function|class) ([a-zA-Z0-9_]+).*/\2/')

    for export_name in $exports; do
        found_in_test=false
        for test_file in "${test_files_for_src[@]}"; do
            if grep -q "$export_name" "$test_file"; then
                found_in_test=true
                break
            fi
        done
        if [ "$found_in_test" = false ]; then
            echo -e "${RED}Error: Export '$export_name' in $src_file is not mentioned in any of its corresponding test files (${test_files_for_src[*]}).${NC}"
            errors_found=true
        fi
    done
done

if [ "$errors_found" = true ]; then
    echo -e "${RED}Not all exports are covered by tests! Get to work!${NC}"
    exit 1
fi

echo -e "${GREEN}All exports are covered.${NC}"
echo -e "${GREEN}Coverage is 100%. Excellent!${NC}"

exit 0