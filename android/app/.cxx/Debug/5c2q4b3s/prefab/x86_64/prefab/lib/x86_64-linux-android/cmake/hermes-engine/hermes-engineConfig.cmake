if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Volumes/DevDrive/Android/gradle_cache/caches/8.10.2/transforms/57ad1723a510b0f34d40ddb6c39dcd06/transformed/hermes-android-0.78.2-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Volumes/DevDrive/Android/gradle_cache/caches/8.10.2/transforms/57ad1723a510b0f34d40ddb6c39dcd06/transformed/hermes-android-0.78.2-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

