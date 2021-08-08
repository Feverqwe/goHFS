package internal

import (
	"syscall"
)

const (
	esContinuous      = 0x80000000
	esSystemRequired  = 0x00000001
	esDisplayRequired = 0x00000002
	//unused
	//esUserPresent      = 0x00000004
	//esAwaymodeRequired = 0x00000040
)

func PowerControl() func() func() {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	setThreadExecutionState := kernel32.NewProc("SetThreadExecutionState")

	count := 0

	return func() func() {
		if count == 0 {
			setThreadExecutionState.Call(uintptr(esSystemRequired | esContinuous))
		}
		count++

		return func() {
			count--
			if count == 0 {
				setThreadExecutionState.Call(uintptr(esContinuous))
			}
		}
	}
}
