if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/dixit/.gradle/caches/8.10.2/transforms/de86646594990f1544815863003b075e/transformed/hermes-android-0.78.2-release/prefab/modules/libhermes/libs/android.armeabi-v7a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/dixit/.gradle/caches/8.10.2/transforms/de86646594990f1544815863003b075e/transformed/hermes-android-0.78.2-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

