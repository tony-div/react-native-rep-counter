project(NitroRepCounter)
cmake_minimum_required(VERSION 3.9.0)

set (PACKAGE_NAME NitroRepCounter)
set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/../cpp/NitroRepCounterRegistration.cpp
)

include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroRepCounter+autolinking.cmake)

include_directories(
        "src/main/cpp"
        "../cpp"
)

find_library(LOG_LIB log)

target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android
)
