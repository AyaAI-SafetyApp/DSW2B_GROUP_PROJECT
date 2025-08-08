import React, { useEffect, useRef, useState } from 'react'
import { Animated, Alert, Dimensions, SafeAreaView, Text, TouchableOpacity, View, Vibration } from 'react-native'

const { width, height } = Dimensions.get('window')

export default function EmergencyScreen({
  countdownSeconds = 5,
  onSendSOS = () => {}
}) {
  const [isCounting, setIsCounting] = useState(false)
  const [seconds, setSeconds] = useState(countdownSeconds)
  const anim = useRef(new Animated.Value(1)).current
  const intervalRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (isCounting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      ).start()
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            finishSOS()
            return countdownSeconds
          }
          return s - 1
        })
      }, 1000)
    } else {
      anim.setValue(1)
      clearInterval(intervalRef.current)
      setSeconds(countdownSeconds)
    }
  }, [isCounting])

  function startCountdown() {
    setIsCounting(true)
  }

  function cancelCountdown() {
    setIsCounting(false)
  }

  async function finishSOS() {
    setIsCounting(false)
    try { Vibration.vibrate(500) } catch (e) {}
    try { await onSendSOS() } catch (e) {}
    Alert.alert('SOS sent', 'Your emergency signal was sent')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency SOS</Text>
      </View>
      <View style={styles.center}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={startCountdown}
          onPress={startCountdown}
          style={styles.sosBtnWrapper}
          disabled={isCounting}
        >
          <Animated.View style={[styles.sosBtn, { transform: [{ scale: anim }] }]}>
            <Text style={styles.sosText}>{isCounting ? seconds : 'SOS'}</Text>
          </Animated.View>
        </TouchableOpacity>
        {isCounting ? (
          <TouchableOpacity onPress={cancelCountdown} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>Hold or tap to start countdown</Text>
        )}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>In an emergency:</Text>
          <Text style={styles.infoText}>• Press and hold SOS to send alerts</Text>
          <Text style={styles.infoText}>• Ensure your location services are on</Text>
          <Text style={styles.infoText}>• Stay in a safe visible area if possible</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const SIZE = Math.min(width, height) * 0.55

const styles = {
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: 64, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, backgroundColor: '#fff' },
  title: { fontSize: 20, color: '#111', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sosBtnWrapper: { zIndex: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  sosBtn: { width: SIZE * 0.78, height: SIZE * 0.78, borderRadius: (SIZE * 0.78) / 2, backgroundColor: '#ff3b30', alignItems: 'center', justifyContent: 'center' },
  sosText: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: 1 },
  cancelBtn: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f2f2f2' },
  cancelText: { color: '#111', fontSize: 16 },
  hint: { color: '#888', marginTop: 18 },
  infoBox: { marginTop: 30, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 12, width: '85%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  infoTitle: { fontWeight: '700', fontSize: 16, marginBottom: 6, color: '#111' },
  infoText: { fontSize: 14, color: '#333', marginBottom: 4 }
}
