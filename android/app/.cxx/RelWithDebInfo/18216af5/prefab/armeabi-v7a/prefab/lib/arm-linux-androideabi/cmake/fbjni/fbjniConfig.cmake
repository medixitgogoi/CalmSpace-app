if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/Volumes/DevDrive/Android/gradle_cache/caches/8.10.2/transforms/99e79a1f7aa2031788e4f4af2a657d48/transformed/fbjni-0.7.0/prefab/modules/fbjni/libs/android.armeabi-v7a/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Volumes/DevDrive/Android/gradle_cache/caches/8.10.2/transforms/99e79a1f7aa2031788e4f4af2a657d48/transformed/fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

