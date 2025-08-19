#pragma once

// NDK C++20 Compatibility Header
// Provides dummy implementations for missing C++20 features

#include <string>
#include <utility>
#include <functional>
#include <cstddef>
#include <cstring>
#include <type_traits>
#include <cmath>

namespace std {

// Provide dummy C++20 concepts that always evaluate to true
#if !defined(__cpp_lib_concepts) || __cpp_lib_concepts < 202002L

template <typename T>
concept regular = true;

template <typename T>
concept semiregular = true;

template <typename From, typename To>
concept convertible_to = true;

template <typename T>
concept default_initializable = true;

template <typename T>
concept copyable = true;

template <typename T>
concept equality_comparable = true;

template <typename T>
concept floating_point = std::is_floating_point_v<T>;

// Iterator concepts
template <typename I>
concept input_iterator = true;

template <typename I>
concept forward_iterator = true;

template <typename I>
concept bidirectional_iterator = true;

template <typename I>
concept random_access_iterator = true;

template <typename I>
concept contiguous_iterator = true;

template <typename I>
concept output_iterator = true;

#endif

// Provide missing bit manipulation functions
#if !defined(__cpp_lib_bit_ops) || __cpp_lib_bit_ops < 202002L

template <typename T>
constexpr int bit_width(T x) noexcept {
    static_assert(std::is_unsigned_v<T>, "bit_width requires unsigned integer");
    if (x == 0) return 0;
    int width = 0;
    while (x) {
        x >>= 1;
        ++width;
    }
    return width;
}

#endif

// Provide missing bit_cast
#if !defined(__cpp_lib_bit_cast) || __cpp_lib_bit_cast < 202002L

template <typename To, typename From>
constexpr To bit_cast(const From& from) noexcept {
    static_assert(sizeof(To) == sizeof(From), "bit_cast requires same size types");
    static_assert(std::is_trivially_copyable_v<To>, "bit_cast requires trivially copyable To type");
    static_assert(std::is_trivially_copyable_v<From>, "bit_cast requires trivially copyable From type");
    
    To result;
    std::memcpy(&result, &from, sizeof(To));
    return result;
}

#endif

// Provide missing std::identity
#if !defined(__cpp_lib_ranges) || __cpp_lib_ranges < 202110L
struct identity {
    template <typename T>
    constexpr T&& operator()(T&& t) const noexcept {
        return std::forward<T>(t);
    }
};
#endif

// Provide basic std::format implementation
#if !defined(__cpp_lib_format) || __cpp_lib_format < 202110L
template <typename... Args>
std::string format(const std::string& fmt, Args&&... args) {
    // Simple fallback - just return the format string
    return fmt;
}
#endif

} // namespace std

// Provide missing hash_combine functions for React Native
namespace facebook {
namespace react {

template <typename T>
void hash_combine(std::size_t& seed, const T& v) {
    std::hash<T> hasher;
    seed ^= hasher(v) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
}

template <typename T, typename... Args>
std::size_t hash_combine(const T& v, const Args&... args) {
    std::size_t seed = std::hash<T>{}(v);
    if constexpr (sizeof...(args) > 0) {
        ((hash_combine(seed, args)), ...);
    }
    return seed;
}

} // namespace react
} // namespace facebook
